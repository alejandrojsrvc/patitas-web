import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authApi, AuthApiError } from "@/infrastructure/api/auth-api";
import { requestCommerce } from "@/infrastructure/api/commerce-api";
import { buildCommerceHeaders } from "@/infrastructure/api/commerce-headers";
import { authCookieNames, clearAuthCookies, clearScopedToken, setAuthCookies, setScopedToken } from "@/lib/auth-cookies";

type Context = { params: Promise<{ resource: string[] }> };

export const GET = (request: Request, context: Context) => handle(request, context, "GET").catch(upstreamErrorResponse);
export const POST = (request: Request, context: Context) => handle(request, context, "POST").catch(upstreamErrorResponse);
export const PUT = (request: Request, context: Context) => handle(request, context, "PUT").catch(upstreamErrorResponse);
export const PATCH = (request: Request, context: Context) => handle(request, context, "PATCH").catch(upstreamErrorResponse);
export const DELETE = (request: Request, context: Context) => handle(request, context, "DELETE").catch(upstreamErrorResponse);

async function handle(request: Request, context: Context, method: string) {
  const { resource } = await context.params;
  const path = `/${resource.join("/")}`;
  if (!isAllowed(path, method)) return NextResponse.json({ message: "Recurso no disponible." }, { status: 404 });
  if (isPublicCatalogRequest(path, method)) return handlePublicCatalogRequest(request, path);
  const upstreamPath = `${path}${new URL(request.url).search}`;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
  const refreshToken = cookieStore.get(authCookieNames.refreshToken)?.value;
  const cartToken = cookieStore.get(authCookieNames.cartToken)?.value;
  const checkoutToken = cookieStore.get(authCookieNames.checkoutToken)?.value;
  const orderToken = cookieStore.get(authCookieNames.orderToken)?.value;
  const orderId = cookieStore.get(authCookieNames.orderId)?.value;
  const visitorId = cookieStore.get(authCookieNames.visitorId)?.value ?? crypto.randomUUID();
  const turnstileToken = request.headers.get("X-Turnstile-Token") ?? undefined;
  const hadAccessToken = Boolean(accessToken || refreshToken);
  const body = method === "GET" || method === "DELETE" ? undefined : await request.text();
  const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;

  let currentAccessToken: string | null | undefined = accessToken;
  let refreshedSession = null;
  let upstream: Response;

  if (!currentAccessToken && refreshToken) {
    const refreshed = await authApi.refresh(refreshToken).catch((cause: unknown) => {
      if (cause instanceof AuthApiError && cause.status === 401) return null;
      throw cause;
    });
    if (refreshed?.status !== "authenticated" || !refreshed.session) {
      return writeResponse(null, 401, { refreshedSession: null, clearAuth: true, sessionFailure: "auth", visitorId });
    }
    currentAccessToken = refreshed.session.accessToken;
    refreshedSession = refreshed.session;
  }

  if (path === "/cart" && method === "GET" && currentAccessToken && cartToken) {
    upstream = await requestCommerce("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ cartToken }),
      headers: { Authorization: `Bearer ${currentAccessToken}` },
    });
    if (upstream.status === 401 && refreshToken) {
      try {
        const refreshed = await authApi.refresh(refreshToken);
        if (refreshed.status === "authenticated" && refreshed.session) {
          currentAccessToken = refreshed.session.accessToken;
          refreshedSession = refreshed.session;
          upstream = await requestCommerce("/cart/merge", {
            method: "POST",
            body: JSON.stringify({ cartToken }),
            headers: { Authorization: `Bearer ${currentAccessToken}` },
          });
        }
      } catch {
        currentAccessToken = null;
      }
    }
    const invalidCartToken = upstream.status >= 400 && upstream.status < 500 && upstream.status !== 401;
    if (invalidCartToken) {
      upstream = await requestCommerce("/cart", {
        headers: { Authorization: `Bearer ${currentAccessToken}` },
      });
    }
    // Only fall back to the guest cart after invalidating authentication.
    // Otherwise GET would show guest items while PUT/DELETE edit the account cart.
    let mergeConfirmed = false;
    const authInvalid = upstream.status === 401;
    if (authInvalid && cartToken) {
      currentAccessToken = null;
      upstream = await requestCommerce("/cart", {
        headers: { "X-Cart-Token": cartToken },
      });
    }
    if (upstream.ok) {
      const payload = await upstream.json();
      mergeConfirmed = payload?.cartMerged === true;
      return writeResponse(payload, upstream.status, {
        refreshedSession: authInvalid ? null : refreshedSession,
        clearAuth: authInvalid,
        clearCartToken: mergeConfirmed || invalidCartToken,
        sessionFailure: upstream.status === 401 ? (hadAccessToken ? "auth" : "checkout") : undefined,
        visitorId,
      });
    }
    const payload = await upstream.json().catch(() => null);
    return writeResponse(payload, upstream.status, {
      refreshedSession,
      clearAuth: upstream.status === 401,
      clearCartToken: invalidCartToken,
      sessionFailure: upstream.status === 401 ? (hadAccessToken ? "auth" : "checkout") : undefined,
      visitorId,
    });
  }

  upstream = await requestCommerce(upstreamPath, {
    method,
    body,
    headers: buildCommerceHeaders({
      path,
      accessToken: currentAccessToken,
      cartToken,
      checkoutToken,
      orderToken,
      turnstileToken,
      visitorId,
      idempotencyKey,
    }),
  });

  if (upstream.status === 401 && currentAccessToken && refreshToken) {
    try {
      const refreshed = await authApi.refresh(refreshToken);
      if (refreshed.status === "authenticated" && refreshed.session) {
        currentAccessToken = refreshed.session.accessToken;
        refreshedSession = refreshed.session;
        upstream = await requestCommerce(upstreamPath, {
          method,
          body,
          headers: buildCommerceHeaders({
            path,
            accessToken: currentAccessToken,
            cartToken,
            checkoutToken,
            orderToken,
            turnstileToken,
            visitorId,
            idempotencyKey,
          }),
        });
      }
    } catch {
      currentAccessToken = null;
    }
  }

  const payload = await upstream.json().catch(() => null);
  const checkoutSessionExpired = isCheckoutSessionExpired(payload);
  return writeResponse(payload, upstream.status, {
    refreshedSession,
    clearAuth: upstream.status === 401,
    sessionFailure: checkoutSessionExpired ? "checkout" : upstream.status === 401 ? (hadAccessToken ? "auth" : "checkout") : undefined,
    setCartToken: typeof payload?.cartToken === "string" ? payload.cartToken : undefined,
    setCheckoutToken: !currentAccessToken && typeof payload?.token === "string" ? payload.token : undefined,
    setOrderToken: typeof payload?.publicToken === "string" ? payload.publicToken : undefined,
    setOrderId:
      typeof payload?.order?.id === "string" ? payload.order.id : typeof payload?.orderId === "string" ? payload.orderId : orderId,
    clearCheckoutToken: checkoutSessionExpired || (typeof payload?.order === "object" && payload?.order !== null),
    clearCartToken: path === "/cart/merge" && upstream.ok && payload?.cartMerged === true,
    visitorId,
  });
}

const publicCatalogPaths = new Set(["/products", "/products/facets", "/products/autocomplete"]);
const catalogScalarParams = new Set([
  "q",
  "species",
  "category",
  "foodType",
  "categorySlug",
  "minPrice",
  "maxPrice",
  "availability",
  "featured",
  "sort",
  "page",
  "perPage",
]);
const catalogListParams = new Set(["brand", "lifeStage", "weightGrams"]);
const catalogSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isPublicCatalogRequest(path: string, method: string) {
  return method === "GET" && publicCatalogPaths.has(path);
}

async function handlePublicCatalogRequest(request: Request, path: string) {
  if (request.headers.get("X-Patitas-Catalog-Client") !== "storefront") {
    return catalogRequestError("Recurso no disponible.", 404);
  }

  const url = new URL(request.url);
  const normalizedQuery = normalizePublicCatalogQuery(path, url.searchParams);
  if (!normalizedQuery) return catalogRequestError("Parámetros de catálogo inválidos.", 400);

  const query = normalizedQuery.toString();
  const upstream = await requestCommerce(`${path}${query ? `?${query}` : ""}`);
  const payload = await upstream.json().catch(() => null);
  return NextResponse.json(payload, {
    status: upstream.status,
    headers: {
      "Cache-Control": upstream.ok ? "public, max-age=60, s-maxage=0, must-revalidate" : "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

function normalizePublicCatalogQuery(path: string, input: URLSearchParams) {
  if (input.toString().length > 2_048) return null;

  const allowedParams =
    path === "/products/autocomplete"
      ? new Set(["q"])
      : path === "/products/facets"
        ? new Set([
            "q",
            "species",
            "category",
            "foodType",
            "categorySlug",
            "minPrice",
            "maxPrice",
            "availability",
            "featured",
            "brand",
            "lifeStage",
            "weightGrams",
          ])
        : new Set([...catalogScalarParams, ...catalogListParams]);
  if ([...input.keys()].some((key) => !allowedParams.has(key))) return null;
  if ([...catalogScalarParams].some((key) => input.getAll(key).length > 1)) return null;

  const output = new URLSearchParams();
  const requestedQuery = input.get("q");
  const q = normalizeText(requestedQuery, 80);
  if (requestedQuery !== null && !q) return null;
  if (path === "/products/autocomplete" && (!q || q.length < 2)) return null;
  if (q) output.set("q", q);

  const species = input.get("species");
  if (species && species !== "DOG" && species !== "CAT") return null;
  if (species) output.set("species", species);

  const category = input.get("category");
  if (category && !new Set(["FOOD", "SNACK", "HYGIENE"]).has(category)) return null;
  if (category) output.set("category", category);

  const foodType = input.get("foodType");
  if (foodType && !new Set(["DRY", "WET"]).has(foodType)) return null;
  if (foodType) output.set("foodType", foodType);

  const categorySlug = input.get("categorySlug");
  if (categorySlug && !isCatalogSlug(categorySlug, 220)) return null;
  if (categorySlug) output.set("categorySlug", categorySlug);

  if (!appendSlugList(output, input, "brand", 20, 220)) return null;
  if (!appendEnumList(output, input, "lifeStage", new Set(["PUPPY", "ADULT", "SENIOR"]), 3)) return null;
  if (!appendIntegerList(output, input, "weightGrams", 20, 1, 100_000)) return null;

  if (!appendDecimal(output, input, "minPrice") || !appendDecimal(output, input, "maxPrice")) return null;

  const availability = input.get("availability");
  if (availability && !new Set(["AVAILABLE", "OUT_OF_STOCK"]).has(availability)) return null;
  if (availability) output.set("availability", availability);

  const featured = input.get("featured");
  if (featured && featured !== "true" && featured !== "false") return null;
  if (featured) output.set("featured", featured);

  const sort = input.get("sort");
  if (sort && !new Set(["featured", "name_asc", "price_asc", "price_desc"]).has(sort)) return null;
  if (sort) output.set("sort", sort);

  if (!appendBoundedInteger(output, input, "page", 1, 250)) return null;
  if (!appendBoundedInteger(output, input, "perPage", 1, 48)) return null;
  return output;
}

function normalizeText(value: string | null, maxLength: number) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function isCatalogSlug(value: string, maxLength: number) {
  return value.length <= maxLength && catalogSlugPattern.test(value);
}

function appendSlugList(output: URLSearchParams, input: URLSearchParams, name: string, maxValues: number, maxLength: number) {
  const values = [...new Set(input.getAll(name))].sort();
  if (values.length > maxValues || values.some((value) => !isCatalogSlug(value, maxLength))) return false;
  values.forEach((value) => output.append(name, value));
  return true;
}

function appendEnumList(output: URLSearchParams, input: URLSearchParams, name: string, allowed: Set<string>, maxValues: number) {
  const values = [...new Set(input.getAll(name))].sort();
  if (values.length > maxValues || values.some((value) => !allowed.has(value))) return false;
  values.forEach((value) => output.append(name, value));
  return true;
}

function appendIntegerList(output: URLSearchParams, input: URLSearchParams, name: string, maxValues: number, min: number, max: number) {
  const values = [...new Set(input.getAll(name))]
    .map(Number)
    .sort((left, right) => left - right);
  if (values.length > maxValues || values.some((value) => !Number.isInteger(value) || value < min || value > max)) return false;
  values.forEach((value) => output.append(name, String(value)));
  return true;
}

function appendDecimal(output: URLSearchParams, input: URLSearchParams, name: string) {
  const value = input.get(name);
  if (value === null) return true;
  if (value.length > 24) return false;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return false;
  output.set(name, String(parsed));
  return true;
}

function appendBoundedInteger(output: URLSearchParams, input: URLSearchParams, name: string, min: number, max: number) {
  const value = input.get(name);
  if (value === null) return true;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return false;
  output.set(name, String(parsed));
  return true;
}

function catalogRequestError(message: string, status: number) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}

function isCheckoutSessionExpired(payload: unknown) {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as { code?: unknown; message?: unknown };
  return (
    value.code === "CHECKOUT_SESSION_EXPIRED_CONFLICT" ||
    value.code === "CHECKOUT_SESSION_INVALID" ||
    (typeof value.message === "string" && /sesión(?: de)? checkout.*expir/i.test(value.message))
  );
}

function writeResponse(
  payload: unknown,
  status: number,
  options: {
    refreshedSession: import("@/domain/auth/types").AuthSession | null;
    clearAuth?: boolean;
    setCartToken?: string;
    setCheckoutToken?: string;
    setOrderToken?: string;
    setOrderId?: string;
    clearCartToken?: boolean;
    clearCheckoutToken?: boolean;
    sessionFailure?: "auth" | "checkout";
    visitorId: string;
  },
) {
  const responsePayload = options.sessionFailure ? sessionFailurePayload(payload, options.sessionFailure) : payload;
  const response = NextResponse.json(responsePayload, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
  if (options.refreshedSession) setAuthCookies(response, options.refreshedSession);
  if (options.clearAuth) clearAuthCookies(response);
  if (options.setCartToken) setScopedToken(response, "cartToken", options.setCartToken);
  if (options.setCheckoutToken) setScopedToken(response, "checkoutToken", options.setCheckoutToken);
  if (options.setOrderToken) setScopedToken(response, "orderToken", options.setOrderToken);
  if (options.setOrderId) setScopedToken(response, "orderId", options.setOrderId);
  if (options.clearCartToken) clearScopedToken(response, "cartToken");
  if (options.clearCheckoutToken) clearScopedToken(response, "checkoutToken");
  setScopedToken(response, "visitorId", options.visitorId);
  return response;
}

function sessionFailurePayload(payload: unknown, failure: "auth" | "checkout") {
  const current = payload && typeof payload === "object" ? payload : {};
  return {
    ...current,
    code: failure === "auth" ? "AUTH_SESSION_INVALID" : "CHECKOUT_SESSION_INVALID",
    message:
      failure === "auth"
        ? "Tu sesión expiró. Iniciá sesión nuevamente para continuar."
        : "La sesión de checkout expiró. Volvé al carrito para iniciar una compra nueva.",
  };
}

function isAllowed(path: string, method: string) {
  if (["/products", "/products/facets", "/products/autocomplete"].includes(path) && method === "GET") return true;
  if (path === "/cart" && ["GET"].includes(method)) return true;
  if (/^\/cart\/items\/[^/]+$/.test(path) && ["PUT", "DELETE"].includes(method)) return true;
  if (/^\/cart\/line-items\/[^/]+$/.test(path) && ["PATCH", "DELETE"].includes(method)) return true;
  if (path === "/cart/merge" && method === "POST") return true;
  if (path === "/me" && method === "GET") return true;
  if (path === "/me/account" && method === "GET") return true;
  if (path === "/storefront/bootstrap" && method === "GET") return true;
  if (path === "/shipping/quote" && method === "GET") return true;
  if (path === "/me/customer" && ["GET", "PATCH"].includes(method)) return true;
  if (path === "/me/addresses" && ["GET", "POST"].includes(method)) return true;
  if (/^\/me\/addresses\/[^/]+$/.test(path) && ["PATCH", "DELETE"].includes(method)) return true;
  if (/^\/me\/orders(\/[^/]+)?$/.test(path) && method === "GET") return true;
  if (/^\/me\/orders\/[^/]+\/(shipment|claims)$/.test(path) && ["GET", "POST"].includes(method)) return true;
  if (/^\/me\/orders\/[^/]+\/address$/.test(path) && method === "PATCH") return true;
  if (path === "/me/pets" && ["GET", "POST"].includes(method)) return true;
  if (/^\/me\/pets\/[^/]+$/.test(path) && method === "PATCH") return true;
  if (/^\/me\/pets\/[^/]+\/current-food$/.test(path) && method === "PUT") return true;
  if (path === "/recently-viewed" && method === "GET") return true;
  if (/^\/products\/[^/]+\/view$/.test(path) && method === "POST") return true;
  if (/^\/checkout\/orders\/[^/]+$/.test(path) && method === "GET") return true;
  if (/^\/payments\/orders\/[^/]+\/link$/.test(path) && method === "POST") return true;
  if (/^\/payments\/orders\/[^/]+\/status$/.test(path) && method === "GET") return true;
  if (path === "/payments/methods" && method === "GET") return true;
  if (path === "/replenishment-plans" && ["GET", "POST"].includes(method)) return true;
  if (/^\/replenishment-plans\/[^/]+$/.test(path) && method === "GET") return true;
  if (/^\/replenishment-plans\/[^/]+\/status$/.test(path) && method === "PATCH") return true;
  if (/^\/replenishment-plans\/[^/]+\/reorder-cart$/.test(path) && method === "POST") return true;
  if (path === "/replenishment-estimates" && method === "POST") return true;
  if (path === "/replenishment-reminders" && ["GET", "POST"].includes(method)) return true;
  if (/^\/replenishment-reminders\/[^/]+\/status$/.test(path) && method === "PATCH") return true;
  if (path === "/me/purchase-schedules" && method === "GET") return true;
  if (/^\/me\/purchase-schedules\/[^/]+$/.test(path) && method === "PATCH") return true;
  if (/^\/me\/purchase-schedules\/[^/]+\/prepare-checkout$/.test(path) && method === "POST") return true;
  if (path === "/checkout/sessions" && method === "POST") return true;
  if (/^\/checkout\/sessions\/[^/]+(\/[^/]+)?$/.test(path) && ["GET", "POST", "PATCH", "DELETE"].includes(method)) return true;
  return false;
}

function upstreamErrorResponse(error: unknown) {
  const timedOut = error instanceof DOMException && error.name === "TimeoutError";
  return NextResponse.json(
    { message: timedOut ? "Patitas API tardó demasiado en responder." : "No pudimos conectar con Patitas API." },
    { status: 504 },
  );
}
