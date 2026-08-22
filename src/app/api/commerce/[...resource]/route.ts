import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authApi } from "@/infrastructure/api/auth-api";
import { requestCommerce } from "@/infrastructure/api/commerce-api";
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
  const visitorId = cookieStore.get(authCookieNames.visitorId)?.value ?? crypto.randomUUID();
  const body = method === "GET" || method === "DELETE" ? undefined : await request.text();

  let currentAccessToken = accessToken;
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
    if (upstream.ok) {
      const payload = await upstream.json();
      return writeResponse(payload, upstream.status, { refreshedSession, clearCartToken: true, visitorId });
    }
    const payload = await upstream.json().catch(() => null);
    return writeResponse(payload, upstream.status, { refreshedSession, clearAuth: upstream.status === 401, visitorId });
  }

  upstream = await requestCommerce(path, {
    method,
    body,
    headers: buildHeaders(path, currentAccessToken, cartToken, checkoutToken, orderToken, visitorId),
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
          headers: buildHeaders(path, currentAccessToken, cartToken, checkoutToken, orderToken, visitorId),
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
    setOrderToken: !currentAccessToken && typeof payload?.publicToken === "string" ? payload.publicToken : undefined,
    clearCheckoutToken: typeof payload?.order === "object" && payload?.order !== null,
    clearCartToken: path === "/cart/merge" && upstream.ok,
    visitorId,
  });
}

function buildHeaders(path: string, accessToken: string | null | undefined, cartToken: string | undefined, checkoutToken: string | undefined, orderToken: string | undefined, visitorId: string) {
  const headers: Record<string, string> = { "X-Visitor-Id": visitorId };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (!accessToken && cartToken && (path === "/cart" || path.startsWith("/cart/items/") || path === "/checkout/sessions")) headers["X-Cart-Token"] = cartToken;
  if (!accessToken && checkoutToken && path.startsWith("/checkout/sessions/")) headers["X-Checkout-Token"] = checkoutToken;
  if (orderToken && path.startsWith("/checkout/orders/")) headers["X-Order-Token"] = orderToken;
  return headers;
}

function writeResponse(payload: unknown, status: number, options: {
  refreshedSession: import("@/domain/auth/types").AuthSession | null;
  clearAuth?: boolean;
  setCartToken?: string;
  setCheckoutToken?: string;
  setOrderToken?: string;
  clearCartToken?: boolean;
  clearCheckoutToken?: boolean;
  visitorId: string;
}) {
  const response = NextResponse.json(payload, { status });
  if (options.refreshedSession) setAuthCookies(response, options.refreshedSession);
  if (options.clearAuth) clearAuthCookies(response);
  if (options.setCartToken) setScopedToken(response, "cartToken", options.setCartToken);
  if (options.setCheckoutToken) setScopedToken(response, "checkoutToken", options.setCheckoutToken);
  if (options.setOrderToken) setScopedToken(response, "orderToken", options.setOrderToken);
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
  if (/^\/me\/(customer|addresses|orders)(\/[^/]+)?$/.test(path) && ["GET", "POST", "PATCH", "DELETE"].includes(method)) return true;
  if (path === "/recently-viewed" && method === "GET") return true;
  if (/^\/products\/[^/]+\/view$/.test(path) && method === "POST") return true;
  if (/^\/checkout\/orders\/[^/]+$/.test(path) && method === "GET") return true;
  if (path === "/checkout/sessions" && method === "POST") return true;
  if (/^\/checkout\/sessions\/[^/]+(\/[^/]+)?$/.test(path) && ["GET", "POST", "PATCH", "DELETE"].includes(method)) return true;
  return false;
}

function upstreamErrorResponse(error: unknown) {
  const timedOut = error instanceof DOMException && error.name === "TimeoutError";
  return NextResponse.json({ message: timedOut ? "Patitas API tardó demasiado en responder." : "No pudimos conectar con Patitas API." }, { status: 504 });
}
