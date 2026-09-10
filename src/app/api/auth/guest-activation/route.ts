import { NextResponse } from "next/server";
import { authApi, AuthApiError } from "@/infrastructure/api/auth-api";
import { setAuthCookies } from "@/lib/auth-cookies";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { token?: string; password?: string; fullName?: string };
    if (!input.token?.trim() || !input.password || input.password.length < 8) return NextResponse.json({ message: "El enlace o la contraseña no son válidos." }, { status: 400 });
    const result = await authApi.guestActivation({ token: input.token, password: input.password, fullName: input.fullName });
    const response = NextResponse.json({ orderId: result.orderId });
    response.headers.set("Cache-Control", "private, no-store");
    setAuthCookies(response, result.session);
    return response;
  } catch (error) {
    return NextResponse.json({ message: error instanceof AuthApiError ? error.message : "No pudimos activar tu cuenta." }, { status: error instanceof AuthApiError ? error.status : 502 });
  }
}
