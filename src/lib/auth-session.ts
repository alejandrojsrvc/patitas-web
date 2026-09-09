import { cookies } from "next/headers";

import { authApi, AuthApiError } from "@/infrastructure/api/auth-api";
import { authCookieNames } from "./auth-cookies";

export class AuthSessionError extends Error {
  constructor(message = "Necesitás iniciar sesión para continuar.") {
    super(message);
    this.name = "AuthSessionError";
  }
}

export async function authenticatedApiCall<T>(operation: (accessToken: string) => Promise<T>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(authCookieNames.accessToken)?.value;
  const refreshToken = cookieStore.get(authCookieNames.refreshToken)?.value;
  if (!accessToken && !refreshToken) throw new AuthSessionError();

  if (!accessToken && refreshToken) {
    const refreshed = await authApi.refresh(refreshToken);
    if (refreshed.status !== "authenticated" || !refreshed.session) {
      throw new AuthSessionError("Tu sesión expiró. Volvé a iniciar sesión.");
    }
    return { data: await operation(refreshed.session.accessToken), refreshedSession: refreshed.session };
  }

  try {
    return { data: await operation(accessToken as string), refreshedSession: null };
  } catch (error) {
    if (!(error instanceof AuthApiError) || error.status !== 401 || !refreshToken) throw error;
    const refreshed = await authApi.refresh(refreshToken);
    if (refreshed.status !== "authenticated" || !refreshed.session) throw new AuthSessionError("Tu sesión expiró. Volvé a iniciar sesión.");
    return { data: await operation(refreshed.session.accessToken), refreshedSession: refreshed.session };
  }
}
