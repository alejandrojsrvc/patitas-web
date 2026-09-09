import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthApiError, authApi, sessionFromResponse } from "@/infrastructure/api/auth-api";
import { mergeAnonymousCart } from "@/infrastructure/api/auth-cart-merge";
import { authCookieNames, clearScopedToken, setAuthCookies } from "@/lib/auth-cookies";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { email?: string; password?: string };
    if (!input.email?.trim() || !input.password) {
      return NextResponse.json({ message: "Ingresá tu email y contraseña." }, { status: 400 });
    }
    const result = await authApi.login(
      { email: input.email.trim().toLowerCase(), password: input.password },
      request.headers.get("X-Turnstile-Token") ?? undefined,
    );
    const session = sessionFromResponse(result);
    const cartToken = (await cookies()).get(authCookieNames.cartToken)?.value;
    const cartMerged = Boolean(session && cartToken && (await mergeAnonymousCart(session.accessToken, cartToken)));
    const response = NextResponse.json({ status: result.status, user: result.user, cartMerged });
    response.headers.set("Cache-Control", "private, no-store");
    if (session) setAuthCookies(response, session);
    if (cartMerged) clearScopedToken(response, "cartToken");
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No pudimos iniciar sesión." },
      { status: error instanceof AuthApiError ? error.status : 502 },
    );
  }
}
