import { NextResponse } from "next/server";

import { AuthApiError, authApi, sessionFromResponse } from "@/infrastructure/api/auth-api";
import { setAuthCookies } from "@/lib/auth-cookies";

export async function POST(request: Request) {
  try {
    const input = await request.json() as { email?: string; password?: string };
    if (!input.email?.trim() || !input.password) {
      return NextResponse.json({ message: "Ingresá tu email y contraseña." }, { status: 400 });
    }
    const result = await authApi.login({ email: input.email.trim().toLowerCase(), password: input.password });
    const response = NextResponse.json({ status: result.status, user: result.user });
    const session = sessionFromResponse(result);
    if (session) setAuthCookies(response, session);
    return response;
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "No pudimos iniciar sesión." }, { status: error instanceof AuthApiError ? error.status : 502 });
  }
}
