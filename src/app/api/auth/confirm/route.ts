import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthApiError, authApi, sessionFromResponse } from "@/infrastructure/api/auth-api";
import { mergeAnonymousCart } from "@/infrastructure/api/auth-cart-merge";
import { authCookieNames, clearScopedToken, setAuthCookies } from "@/lib/auth-cookies";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { token?: string; type?: string };
    const token = input.token?.trim();
    const type = input.type === "signup" || input.type === "magiclink" ? input.type : null;
    if (!token || token.length < 16 || token.length > 2048 || !type) {
      return NextResponse.json({ message: "El enlace de confirmación no es válido." }, { status: 400 });
    }

    const result = await authApi.confirmEmail({ token, type });
    const session = sessionFromResponse(result);
    if (!session) return NextResponse.json({ message: "No pudimos activar tu cuenta." }, { status: 502 });

    const cookieStore = await cookies();
    const cartToken = cookieStore.get(authCookieNames.cartToken)?.value;
    const cartMerged = Boolean(cartToken && (await mergeAnonymousCart(session.accessToken, cartToken)));
    const response = NextResponse.json(
      { status: result.status, user: result.user, cartMerged },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    setAuthCookies(response, session);
    if (cartMerged) clearScopedToken(response, "cartToken");
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No pudimos confirmar tu cuenta." },
      { status: error instanceof AuthApiError ? error.status : 502, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
