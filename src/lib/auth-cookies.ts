import type { NextResponse } from "next/server";
import type { AuthSession } from "@/domain/auth/types";

export const authCookieNames = {
  accessToken: "patitas-access-token",
  refreshToken: "patitas-refresh-token",
  cartToken: "patitas-cart-token",
  checkoutToken: "patitas-checkout-token",
  orderToken: "patitas-order-token",
  orderId: "patitas-order-id",
  visitorId: "patitas-visitor-id",
} as const;

const isProduction = process.env.NODE_ENV === "production";

export function setAuthCookies(response: NextResponse, session: AuthSession) {
  response.cookies.set(authCookieNames.accessToken, session.accessToken, {
    ...baseCookie(),
    maxAge: accessMaxAge(session.expiresAt),
  });
  response.cookies.set(authCookieNames.refreshToken, session.refreshToken, {
    ...baseCookie(),
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(authCookieNames.accessToken);
  response.cookies.delete(authCookieNames.refreshToken);
}

export function setScopedToken(response: NextResponse, name: keyof typeof authCookieNames, value: string) {
  response.cookies.set(authCookieNames[name], value, {
    ...baseCookie(),
    maxAge: name === "checkoutToken" ? 60 * 60 * 2 : 60 * 60 * 24 * 30,
  });
}

export function clearScopedToken(response: NextResponse, name: keyof typeof authCookieNames) {
  response.cookies.delete(authCookieNames[name]);
}

function baseCookie() {
  return { httpOnly: true, sameSite: "lax" as const, secure: isProduction, path: "/" };
}

function accessMaxAge(expiresAt: number | null) {
  if (!expiresAt) return 60 * 60;
  return Math.max(60, Math.floor(expiresAt - Date.now() / 1000));
}
