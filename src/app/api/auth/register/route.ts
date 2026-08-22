import { NextResponse } from "next/server";

import { AuthApiError, authApi, sessionFromResponse } from "@/infrastructure/api/auth-api";
import { setAuthCookies } from "@/lib/auth-cookies";

export async function POST(request: Request) {
  try {
    const input = await request.json() as { email?: string; password?: string };
    if (!input.email?.trim() || !input.password || input.password.length < 8) {
      return NextResponse.json({ message: "Ingresá un email válido y una contraseña de al menos 8 caracteres." }, { status: 400 });
    }
    const result = await authApi.register({ email: input.email.trim().toLowerCase(), password: input.password });
    const response = NextResponse.json({ status: result.status, user: result.user }, { status: 201 });
    const session = sessionFromResponse(result);
    if (session) setAuthCookies(response, session);
    return response;
  } catch (error) {
    return authErrorResponse(error, "No pudimos crear tu cuenta.");
  }
}

function authErrorResponse(error: unknown, fallback: string) {
  return NextResponse.json({ message: error instanceof Error ? error.message : fallback }, { status: error instanceof AuthApiError ? error.status : 502 });
}
