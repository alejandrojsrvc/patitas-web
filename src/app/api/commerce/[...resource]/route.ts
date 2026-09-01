import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authApi } from "@/infrastructure/api/auth-api";
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

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
  const refreshToken = cookieStore.get(authCookieNames.refreshToken)?.value;
  const cartToken = cookieStore.get(authCookieNames.cartToken)?.value;
  const checkoutToken = cookieStore.get(authCookieNames.checkoutToken)?.value;
  const orderToken = cookieStore.get(authCookieNames.orderToken)?.value;
  const orderId = cookieStore.get(authCookieNames.orderId)?.value;
  const visitorId = cookieStore.get(authCookieNames.visitorId)?.value ?? crypto.randomUUID();
  const body = method === "GET" || method === "DELETE" ? undefined : await request.text();
  const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;

  let currentAccessToken: string | null | undefined = accessToken;
  let refreshedSession = null;
  let upstream: Response;

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
    // Si la sesión autenticada expiró o el merge no puede completarse,
    // el carrito anónimo sigue siendo recuperable con su X-Cart-Token.
    let mergeConfirmed = false;
    if (!upstream.ok && cartToken) {
      currentAccessToken = null;
      upstream = await requestCommerce("/cart", {
        headers: { "X-Cart-Token": cartToken },
      });
    }
    if (upstream.ok) {
      const payload = await upstream.json();
      mergeConfirmed = payload?.cartMerged === true;
      return writeResponse(payload, upstream.status, { refreshedSession, clearCartToken: mergeConfirmed, visitorId });
    }
    const payload = await upstream.json().catch(() => null);
    return writeResponse(payload, upstream.status, { refreshedSession, clearAuth: upstream.status === 401, visitorId });
  }

  upstream = await requestCommerce(path, {
    method,
    body,
    headers: buildCommerceHeaders({ path, accessToken: currentAccessToken, cartToken, checkoutToken, orderToken, visitorId, idempotencyKey }),
  });

  if (upstream.status === 401 && currentAccessToken && refreshToken) {
    try {
      const refreshed = await authApi.refresh(refreshToken);
      if (refreshed.status === "authenticated" && refreshed.session) {
        currentAccessToken = refreshed.session.accessToken;
        refreshedSession = refreshed.session;
        upstream = await requestCommerce(path, {
          method,
          body,
          headers: buildCommerceHeaders({ path, accessToken: currentAccessToken, cartToken, checkoutToken, orderToken, visitorId, idempotencyKey }),
        });
      }
    } catch {
      currentAccessToken = null;
    }
  }

  const payload = await upstream.json().catch(() => null);
  return writeResponse(payload, upstream.status, {
    refreshedSession,
    clearAuth: upstream.status === 401,
    setCartToken: typeof payload?.cartToken === "string" ? payload.cartToken : undefined,
    setCheckoutToken: !currentAccessToken && typeof payload?.token === "string" ? payload.token : undefined,
    setOrderToken: typeof payload?.publicToken === "string" ? payload.publicToken : undefined,
    setOrderId: typeof payload?.order?.id === "string" ? payload.order.id : typeof payload?.orderId === "string" ? payload.orderId : orderId,
    clearCheckoutToken: typeof payload?.order === "object" && payload?.order !== null,
    clearCartToken: path === "/cart/merge" && upstream.ok && payload?.cartMerged === true,
    visitorId,
  });
}

function writeResponse(payload: unknown, status: number, options: {
  refreshedSession: import("@/domain/auth/types").AuthSession | null;
  clearAuth?: boolean;
  setCartToken?: string;
  setCheckoutToken?: string;
  setOrderToken?: string;
  setOrderId?: string;
  clearCartToken?: boolean;
  clearCheckoutToken?: boolean;
  visitorId: string;
}) {
  const response = NextResponse.json(payload, {
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

function isAllowed(path: string, method: string) {
  if (path === "/cart" && ["GET"].includes(method)) return true;
  if (/^\/cart\/items\/[^/]+$/.test(path) && ["PUT", "DELETE"].includes(method)) return true;
  if (path === "/cart/merge" && method === "POST") return true;
  if (path === "/me" && method === "GET") return true;
  if (path === "/storefront/bootstrap" && method === "GET") return true;
  if (path === "/me/customer" && ["GET", "PATCH"].includes(method)) return true;
  if (path === "/me/addresses" && ["GET", "POST"].includes(method)) return true;
  if (/^\/me\/addresses\/[^/]+$/.test(path) && ["PATCH", "DELETE"].includes(method)) return true;
  if (/^\/me\/orders(\/[^/]+)?$/.test(path) && method === "GET") return true;
  if (path === "/me/pets" && ["GET", "POST"].includes(method)) return true;
  if (/^\/me\/pets\/[^/]+$/.test(path) && method === "PATCH") return true;
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
  if (path === "/checkout/sessions" && method === "POST") return true;
  if (/^\/checkout\/sessions\/[^/]+(\/[^/]+)?$/.test(path) && ["GET", "POST", "PATCH", "DELETE"].includes(method)) return true;
  return false;
}

function upstreamErrorResponse(error: unknown) {
  const timedOut = error instanceof DOMException && error.name === "TimeoutError";
  return NextResponse.json({ message: timedOut ? "Patitas API tardó demasiado en responder." : "No pudimos conectar con Patitas API." }, { status: 504 });
}
