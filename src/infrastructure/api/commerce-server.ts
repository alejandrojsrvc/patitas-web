import "server-only";

import { cookies } from "next/headers";

import type { CheckoutSession, ShippingOption } from "@/domain/checkout/types";
import type { Cart } from "@/domain/cart/types";
import { authCookieNames } from "@/lib/auth-cookies";
import { requestCommerce } from "./commerce-api";

export async function getServerCart(): Promise<Cart | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
  const cartToken = cookieStore.get(authCookieNames.cartToken)?.value;
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  else if (cartToken) headers["X-Cart-Token"] = cartToken;

  const response = await requestCommerce("/cart", { headers });
  if (!response.ok) return null;
  return response.json() as Promise<Cart>;
}

export async function getServerCheckoutData(sessionId: string): Promise<{ session: CheckoutSession; shippingOptions: ShippingOption[] } | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
  const checkoutToken = cookieStore.get(authCookieNames.checkoutToken)?.value;
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  else if (checkoutToken) headers["X-Checkout-Token"] = checkoutToken;
  else return null;

  const sessionResponse = await requestCommerce(`/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers });
  if (!sessionResponse.ok) return null;
  const session = await sessionResponse.json() as CheckoutSession;
  if (session.stage !== "PAYMENT" && session.stage !== "CONFIRMATION") return { session, shippingOptions: [] };

  const optionsResponse = await requestCommerce(`/checkout/sessions/${encodeURIComponent(sessionId)}/shipping-options`, { headers });
  const shippingOptions = optionsResponse.ok ? await optionsResponse.json() as ShippingOption[] : [];
  return { session, shippingOptions };
}
