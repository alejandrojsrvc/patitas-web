import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authApi } from "@/infrastructure/api/auth-api";
import { authCookieNames, clearAuthCookies } from "@/lib/auth-cookies";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "private, no-store");

  const accessToken = (await cookies()).get(authCookieNames.accessToken)?.value;
  if (accessToken) {
    try {
      await authApi.logout(accessToken);
    } catch {
      // Logout is idempotent from the browser perspective: local cookies must
      // be removed even when the upstream token was already invalidated or
      // the API is temporarily unavailable.
    }
  }
  clearAuthCookies(response);
  return response;
}
