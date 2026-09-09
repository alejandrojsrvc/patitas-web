import { NextResponse } from "next/server";

import { AuthApiError, authApi } from "@/infrastructure/api/auth-api";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { email?: string };
    const email = input.email?.trim().toLowerCase();
    if (!email || email.length > 320 || !email.includes("@")) {
      return NextResponse.json({ message: "Ingresá un email válido." }, { status: 400 });
    }

    const result = await authApi.resendConfirmation({ email }, request.headers.get("X-Turnstile-Token") ?? undefined);
    return NextResponse.json(result, { status: 202, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No pudimos reenviar el correo de confirmación." },
      { status: error instanceof AuthApiError ? error.status : 502, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
