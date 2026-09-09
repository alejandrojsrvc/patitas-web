import "server-only";

import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";

import type { CheckoutScreen } from "@/domain/checkout/types";
import type { CustomerProfile } from "@/domain/customer/types";
import type { AccountScreen, ApiAccountSection, CartScreen, ServerBootstrapResult, StorefrontShell } from "@/domain/storefront/types";
import { authCookieNames } from "@/lib/auth-cookies";
import { requestCommerce } from "./commerce-api";

type CookieCredentials = {
  accessToken?: string;
  refreshToken?: string;
  cartToken?: string;
  checkoutToken?: string;
};

export async function getStorefrontBootstrap(): Promise<ServerBootstrapResult<StorefrontShell>> {
  const credentials = await readCredentials();
  if (!credentials.accessToken && credentials.refreshToken) return refreshRequired();

  return requestBootstrap("/storefront/bootstrap", {
    credentials,
    headers: optionalCartHeaders(credentials),
  });
}

export async function getCartBootstrap(): Promise<ServerBootstrapResult<CartScreen>> {
  const credentials = await readCredentials();
  if (!credentials.accessToken && credentials.refreshToken) return refreshRequired();

  return requestBootstrap("/cart/bootstrap", {
    credentials,
    headers: optionalCartHeaders(credentials),
  });
}

export async function getAccountScreen(input: {
  section: ApiAccountSection;
  orderId?: string;
  page?: number;
  perPage?: number;
}): Promise<ServerBootstrapResult<AccountScreen>> {
  const credentials = await readCredentials();
  if (!credentials.accessToken) {
    return credentials.refreshToken ? refreshRequired() : emptyResult();
  }

  const params = new URLSearchParams({ section: input.section });
  if (input.orderId) params.set("orderId", input.orderId);
  if (input.page) params.set("page", String(input.page));
  if (input.perPage) params.set("perPage", String(input.perPage));

  return requestBootstrap(`/me/account?${params.toString()}`, {
    credentials,
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
  });
}

export async function getCheckoutBootstrap(sessionId: string): Promise<ServerBootstrapResult<CheckoutScreen>> {
  const credentials = await readCredentials();
  if (!credentials.accessToken && credentials.refreshToken) return refreshRequired();
  if (!credentials.accessToken && !credentials.checkoutToken) return emptyResult();

  const headers: Record<string, string> = {};
  if (credentials.accessToken) headers.Authorization = `Bearer ${credentials.accessToken}`;
  else if (credentials.checkoutToken) headers["X-Checkout-Token"] = credentials.checkoutToken;

  const checkoutResult = await requestBootstrap<CheckoutScreen>(`/checkout/sessions/${encodeURIComponent(sessionId)}/bootstrap`, {
    credentials,
    headers,
  });
  if (!checkoutResult.data || !credentials.accessToken) return checkoutResult;

  try {
    const customerResponse = await requestCommerce("/me/customer", { headers: { Authorization: `Bearer ${credentials.accessToken}` } });
    const customer = (await customerResponse.json().catch(() => null)) as CustomerProfile | null;
    if (customerResponse.ok && customer?.email) {
      return {
        ...checkoutResult,
        data: {
          ...checkoutResult.data,
          customer: { fullName: customer.fullName, email: customer.email, phone: customer.phone },
        },
      };
    }
  } catch (error) {
    unstable_rethrow(error);
    // El perfil es una mejora de precarga; no debe impedir continuar con el checkout.
  }

  return checkoutResult;
}

async function requestBootstrap<T>(
  path: string,
  options: { credentials: CookieCredentials; headers: Record<string, string> },
): Promise<ServerBootstrapResult<T>> {
  try {
    const response = await requestCommerce(path, { headers: options.headers });
    const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;

    if (response.status === 401 && options.credentials.refreshToken) return refreshRequired();
    if (!response.ok || !payload) {
      return {
        data: null,
        refreshRequired: false,
        error:
          payload && typeof payload === "object" && "message" in payload
            ? (payload.message ?? "Patitas API no pudo completar la solicitud.")
            : "Patitas API no pudo completar la solicitud.",
      };
    }

    return { data: payload as T, refreshRequired: false, error: null };
  } catch (error) {
    unstable_rethrow(error);
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return {
      data: null,
      refreshRequired: false,
      error: timedOut ? "Patitas API tardó demasiado en responder." : "No pudimos conectar con Patitas API.",
    };
  }
}

async function readCredentials(): Promise<CookieCredentials> {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(authCookieNames.accessToken)?.value,
    refreshToken: cookieStore.get(authCookieNames.refreshToken)?.value,
    cartToken: cookieStore.get(authCookieNames.cartToken)?.value,
    checkoutToken: cookieStore.get(authCookieNames.checkoutToken)?.value,
  };
}

function optionalCartHeaders(credentials: CookieCredentials) {
  const headers: Record<string, string> = {};
  if (credentials.accessToken) headers.Authorization = `Bearer ${credentials.accessToken}`;
  if (credentials.cartToken) headers["X-Cart-Token"] = credentials.cartToken;
  return headers;
}

function emptyResult<T>(): ServerBootstrapResult<T> {
  return { data: null, refreshRequired: false, error: null };
}

function refreshRequired<T>(): ServerBootstrapResult<T> {
  return { data: null, refreshRequired: true, error: null };
}
