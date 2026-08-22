import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { CheckoutCreateResult } from "@/domain/checkout/types";
import type { Cart } from "@/domain/cart/types";
import { requestCommerce } from "@/infrastructure/api/commerce-api";
import { authCookieNames, clearScopedToken, setScopedToken } from "@/lib/auth-cookies";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
  const cartToken = cookieStore.get(authCookieNames.cartToken)?.value;
  const authHeaders: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  let cartResponse: Response;
  let mergedGuestCart = false;

  if (accessToken && cartToken) {
    cartResponse = await requestCommerce("/cart/merge", { method: "POST", body: JSON.stringify({ cartToken }), headers: authHeaders });
    mergedGuestCart = cartResponse.ok;
  } else {
    cartResponse = await requestCommerce("/cart", { headers: accessToken ? authHeaders : cartToken ? { "X-Cart-Token": cartToken } : {} });
  }

  if (!cartResponse.ok) return NextResponse.json({ message: "No pudimos cargar tu carrito." }, { status: cartResponse.status });
  const cart = await cartResponse.json() as Cart;
  if (!cart.items.length) return NextResponse.redirect(new URL("/carrito", request.url));

  const nextCartToken = typeof cart.cartToken === "string" ? cart.cartToken : cartToken;
  const checkoutHeaders: Record<string, string> = accessToken ? authHeaders : nextCartToken ? { "X-Cart-Token": nextCartToken } : {};
  const sessionResponse = await requestCommerce("/checkout/sessions", { method: "POST", body: JSON.stringify({ cartId: cart.id }), headers: checkoutHeaders });
  if (!sessionResponse.ok) return NextResponse.json({ message: "No pudimos iniciar el checkout." }, { status: sessionResponse.status });
  const result = await sessionResponse.json() as CheckoutCreateResult;
  const response = NextResponse.redirect(new URL(`/checkout?sessionId=${encodeURIComponent(result.session.id)}`, request.url));

  if (!accessToken && nextCartToken) setScopedToken(response, "cartToken", nextCartToken);
  if (mergedGuestCart) clearScopedToken(response, "cartToken");
  if (!accessToken && result.token) setScopedToken(response, "checkoutToken", result.token);
  return response;
}
