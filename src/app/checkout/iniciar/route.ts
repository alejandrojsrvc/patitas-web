import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { CheckoutCreateResult } from "@/domain/checkout/types";
import type { Cart } from "@/domain/cart/types";
import { requestCommerce } from "@/infrastructure/api/commerce-api";
import { authCookieNames, clearScopedToken, setScopedToken } from "@/lib/auth-cookies";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
    const cartToken = cookieStore.get(authCookieNames.cartToken)?.value;
    const orderId = cookieStore.get(authCookieNames.orderId)?.value;
    const authHeaders: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    let cartResponse: Response;
    let mergedGuestCart = false;

    if (accessToken && cartToken) {
      cartResponse = await requestCommerce("/cart/merge", { method: "POST", body: JSON.stringify({ cartToken }), headers: authHeaders });
    } else {
      cartResponse = await requestCommerce("/cart", { headers: accessToken ? authHeaders : cartToken ? { "X-Cart-Token": cartToken } : {} });
    }

    if (!cartResponse.ok) return redirectToCart(request, "cart-unavailable");
    const cart = await cartResponse.json() as Cart & { cartMerged?: boolean };
    mergedGuestCart = cartResponse.ok && cart.cartMerged === true;
    if (!cart.items.length) return NextResponse.redirect(new URL("/carrito", request.url));

    const nextCartToken = typeof cart.cartToken === "string" ? cart.cartToken : cartToken;
    const checkoutHeaders: Record<string, string> = accessToken ? authHeaders : nextCartToken ? { "X-Cart-Token": nextCartToken } : {};
    const sessionResponse = await requestCommerce("/checkout/sessions", { method: "POST", body: JSON.stringify({ cartId: cart.id }), headers: checkoutHeaders });
    if (!sessionResponse.ok) {
      // Si el intento anterior ya creó una orden, conservar el acceso a su
      // estado en lugar de intentar abrir otra sesión sobre el mismo carrito.
      if (sessionResponse.status === 409 && orderId) return NextResponse.redirect(new URL("/checkout/resultado", request.url));
      return redirectToCart(request, sessionResponse.status >= 500 ? "checkout-unavailable" : "checkout-conflict");
    }
    const result = await sessionResponse.json() as CheckoutCreateResult;
    const response = NextResponse.redirect(new URL(`/checkout?sessionId=${encodeURIComponent(result.session.id)}`, request.url));

    if (!accessToken && nextCartToken) setScopedToken(response, "cartToken", nextCartToken);
    if (mergedGuestCart) clearScopedToken(response, "cartToken");
    if (!accessToken && result.token) setScopedToken(response, "checkoutToken", result.token);
    return response;
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
