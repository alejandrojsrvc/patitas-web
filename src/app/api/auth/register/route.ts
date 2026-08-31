import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthApiError, authApi, sessionFromResponse } from "@/infrastructure/api/auth-api";
import { mergeAnonymousCart } from "@/infrastructure/api/auth-cart-merge";
import { authCookieNames, clearScopedToken, setAuthCookies } from "@/lib/auth-cookies";

export async function POST(request: Request) {
  try {
    const input = await request.json() as { email?: string; password?: string };
    if (!input.email?.trim() || !input.password || input.password.length < 8) {
      return NextResponse.json({ message: "Ingresá un email válido y una contraseña de al menos 8 caracteres." }, { status: 400 });
    }
    const result = await authApi.register({ email: input.email.trim().toLowerCase(), password: input.password });
    const session = sessionFromResponse(result);
    const cartToken = (await cookies()).get(authCookieNames.cartToken)?.value;
    const cartMerged = Boolean(session && cartToken && await mergeAnonymousCart(session.accessToken, cartToken));
    const response = NextResponse.json({ status: result.status, user: result.user, cartMerged }, { status: 201 });
    response.headers.set("Cache-Control", "private, no-store");
    if (session) setAuthCookies(response, session);
    if (cartMerged) clearScopedToken(response, "cartToken");
    return response;
  } catch (error) {
    return authErrorResponse(error, "No pudimos crear tu cuenta.");
  }
}

function authErrorResponse(error: unknown, fallback: string) {
  return NextResponse.json({ message: error instanceof Error ? error.message : fallback }, { status: error instanceof AuthApiError ? error.status : 502 });
}
