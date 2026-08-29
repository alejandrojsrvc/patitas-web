import "server-only";

import { cookies } from "next/headers";

import type { AvailablePaymentMethod, CheckoutSession, ShippingOption } from "@/domain/checkout/types";
import type { Cart } from "@/domain/cart/types";
import type { CustomerAddress } from "@/domain/customer/types";
import { authCookieNames } from "@/lib/auth-cookies";
import { requestCommerce } from "./commerce-api";

export async function getServerCart(): Promise<Cart | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
    const cartToken = cookieStore.get(authCookieNames.cartToken)?.value;
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    else if (cartToken) headers["X-Cart-Token"] = cartToken;

    const response = await requestCommerce("/cart", { headers });
    if (!response.ok) return null;
    return response.json() as Promise<Cart>;
  } catch {
    // El storefront puede renderizar el estado recuperable del carrito aunque
    // Nest esté temporalmente inaccesible.
    return null;
  }
}

export type ServerCheckoutData = {
  session: CheckoutSession;
  shippingOptions: ShippingOption[];
  paymentMethods: AvailablePaymentMethod[];
  savedAddresses: CustomerAddress[];
};

export async function getServerCheckoutData(sessionId: string): Promise<ServerCheckoutData | null> {
  try {
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
    const [optionsResponse, methodsResponse, addressesResponse] = await Promise.all([
      session.stage === "CONTACT"
        ? Promise.resolve(null)
        : requestCommerce(`/checkout/sessions/${encodeURIComponent(sessionId)}/shipping-options`, { headers }),
      requestCommerce("/payments/methods"),
      accessToken ? requestCommerce("/me/addresses", { headers: { Authorization: `Bearer ${accessToken}` } }) : Promise.resolve(null),
    ]);
    const shippingOptions = optionsResponse?.ok ? await optionsResponse.json() as unknown : [];
    const paymentMethods = methodsResponse.ok ? await methodsResponse.json() as unknown : [];
    const savedAddresses = addressesResponse?.ok ? await addressesResponse.json() as unknown : [];
    return {
      session,
      shippingOptions: Array.isArray(shippingOptions) ? shippingOptions as ShippingOption[] : [],
      paymentMethods: Array.isArray(paymentMethods) ? paymentMethods as AvailablePaymentMethod[] : [],
      savedAddresses: Array.isArray(savedAddresses) ? savedAddresses as CustomerAddress[] : [],
    };
  } catch {
    return null;
  }
}
