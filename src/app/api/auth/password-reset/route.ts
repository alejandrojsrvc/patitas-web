import { NextResponse } from "next/server";

import { AuthApiError, authApi } from "@/infrastructure/api/auth-api";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { token?: string; newPassword?: string };
    const token = input.token?.trim();
    const newPassword = input.newPassword;
    if (!token || token.length < 16 || token.length > 2048 || !newPassword || newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json({ message: "El enlace o la nueva contraseña no son válidos." }, { status: 400 });
    }
    await authApi.passwordReset({ token, newPassword });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No pudimos actualizar la contraseña." },
      { status: error instanceof AuthApiError ? error.status : 502 },
    );
  }
}
