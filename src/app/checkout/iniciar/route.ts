import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { CheckoutCreateResult } from "@/domain/checkout/types";
import type { Cart } from "@/domain/cart/types";
import { requestCommerce } from "@/infrastructure/api/commerce-api";
import { authApi, AuthApiError } from "@/infrastructure/api/auth-api";
import type { AuthSession } from "@/domain/auth/types";
import { authCookieNames, clearAuthCookies, clearScopedToken, setAuthCookies, setScopedToken } from "@/lib/auth-cookies";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
    const refreshToken = cookieStore.get(authCookieNames.refreshToken)?.value;
    let refreshedSession: AuthSession | null = null;
    const finish = (response: NextResponse) => {
      if (refreshedSession) setAuthCookies(response, refreshedSession);
      response.headers.set("Cache-Control", "no-store");
      return response;
    };
    const cartToken = cookieStore.get(authCookieNames.cartToken)?.value;
    if (!accessToken && refreshToken) {
      const refreshed = await refreshCheckoutAuth(refreshToken);
      if (refreshed?.status !== "authenticated" || !refreshed.session) {
        const response = redirectToCart(request, "session-expired");
        clearAuthCookies(response);
        return response;
      }
      refreshedSession = refreshed.session;
      accessToken = refreshed.session.accessToken;
    }
    let authHeaders: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    let cartResponse: Response;
    let mergedGuestCart = false;

    if (accessToken && cartToken) {
      cartResponse = await requestCommerce("/cart/merge", { method: "POST", body: JSON.stringify({ cartToken }), headers: authHeaders });
    } else {
      cartResponse = await requestCommerce("/cart", {
        headers: accessToken ? authHeaders : cartToken ? { "X-Cart-Token": cartToken } : {},
      });
    }

    if (cartResponse.status === 401 && refreshToken && !refreshedSession) {
      const refreshed = await refreshCheckoutAuth(refreshToken);
      if (refreshed?.status === "authenticated" && refreshed.session) {
        refreshedSession = refreshed.session;
        accessToken = refreshed.session.accessToken;
        authHeaders = { Authorization: `Bearer ${accessToken}` };
        cartResponse = await requestCommerce(cartToken ? "/cart/merge" : "/cart", {
          method: cartToken ? "POST" : "GET",
          ...(cartToken ? { body: JSON.stringify({ cartToken }) } : {}),
          headers: authHeaders,
        });
      }
    }
    if (cartResponse.status === 401) {
      const response = redirectToCart(request, "session-expired");
      clearAuthCookies(response);
      return response;
    }
    if (!cartResponse.ok) return finish(redirectToCart(request, "cart-unavailable"));
    const cart = (await cartResponse.json()) as Cart & { cartMerged?: boolean };
    mergedGuestCart = cartResponse.ok && cart.cartMerged === true;
    if (!cart.items.length) return finish(NextResponse.redirect(new URL("/carrito", request.url)));

    const nextCartToken = typeof cart.cartToken === "string" ? cart.cartToken : cartToken;
    const checkoutHeaders: Record<string, string> = accessToken ? authHeaders : nextCartToken ? { "X-Cart-Token": nextCartToken } : {};
    const sessionResponse = await requestCommerce("/checkout/sessions", {
      method: "POST",
      body: JSON.stringify({ cartId: cart.id }),
      headers: checkoutHeaders,
    });
    if (!sessionResponse.ok) {
      return finish(redirectToCart(request, sessionResponse.status >= 500 ? "checkout-unavailable" : "checkout-conflict"));
    }
    const result = (await sessionResponse.json()) as CheckoutCreateResult;
    const response = NextResponse.redirect(new URL(`/checkout?sessionId=${encodeURIComponent(result.session.id)}`, request.url));

    if (!accessToken && nextCartToken) setScopedToken(response, "cartToken", nextCartToken);
    if (mergedGuestCart) clearScopedToken(response, "cartToken");
    if (result.token) setScopedToken(response, "checkoutToken", result.token);
    else clearScopedToken(response, "checkoutToken");
    return finish(response);
  } catch {
    // La navegación del checkout no debe terminar en un 500 de Next si el
    // backend está temporalmente caído o agotó el timeout de red.
    return redirectToCart(request, "checkout-unavailable");
  }
}

function redirectToCart(request: Request, reason: string) {
  const url = new URL("/carrito", request.url);
  url.searchParams.set("checkoutError", reason);
  return NextResponse.redirect(url);
}

async function refreshCheckoutAuth(refreshToken: string) {
  try {
    return await authApi.refresh(refreshToken);
  } catch (cause) {
    if (cause instanceof AuthApiError && cause.status === 401) return null;
    throw cause;
  }
}
