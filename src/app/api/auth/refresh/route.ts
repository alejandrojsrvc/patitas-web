import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AuthApiError, authApi, sessionFromResponse } from "@/infrastructure/api/auth-api";
import { authCookieNames, clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";

export async function POST() {
  try {
    const refreshToken = (await cookies()).get(authCookieNames.refreshToken)?.value;
    if (!refreshToken) return NextResponse.json({ message: "No hay una sesión renovable." }, { status: 401 });
    const result = await authApi.refresh(refreshToken);
    const session = sessionFromResponse(result);
    if (!session) return NextResponse.json({ message: "La sesión no puede renovarse." }, { status: 401 });
    const response = NextResponse.json({ status: result.status, user: result.user });
    setAuthCookies(response, session);
    return response;
  } catch (error) {
    const response = NextResponse.json({ message: error instanceof Error ? error.message : "La sesión no puede renovarse." }, { status: error instanceof AuthApiError ? error.status : 502 });
    if (error instanceof AuthApiError && error.status === 401) clearAuthCookies(response);
    return response;
  }
}
