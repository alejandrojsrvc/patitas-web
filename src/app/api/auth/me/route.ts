import { NextResponse } from "next/server";

import { authApi, AuthApiError } from "@/infrastructure/api/auth-api";
import { authenticatedApiCall, AuthSessionError } from "@/lib/auth-session";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";

export async function GET() {
  try {
    const result = await authenticatedApiCall((accessToken) => authApi.current(accessToken));
    const response = NextResponse.json({ id: result.data.userId, email: result.data.email, role: result.data.role });
    if (result.refreshedSession) setAuthCookies(response, result.refreshedSession);
    return response;
  } catch (error) {
    const response = NextResponse.json(
      { message: error instanceof Error ? error.message : "Necesitás iniciar sesión." },
      { status: error instanceof AuthApiError && error.status !== 401 ? error.status : 401 },
    );
    if (error instanceof AuthSessionError || (error instanceof AuthApiError && error.status === 401)) clearAuthCookies(response);
    return response;
  }
}
