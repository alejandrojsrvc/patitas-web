import "server-only";

import type { AuthResponse, AuthSession, CurrentUser } from "@/domain/auth/types";

const apiUrl = (process.env.PATITAS_API_URL ?? "http://api.patitasinquietas.local/api/v1").replace(/\/$/, "");

export class AuthApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) throw new AuthApiError(payload?.message ?? "Patitas API no pudo completar la solicitud.", response.status);
  return payload as T;
}

export const authApi = {
  register: (input: { email: string; password: string }) => request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) => request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
  refresh: (refreshToken: string) => request<AuthResponse>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }),
  current: (accessToken: string) => request<CurrentUser>("/me", { headers: { Authorization: `Bearer ${accessToken}` } }),
};

export function sessionFromResponse(response: AuthResponse): AuthSession | null {
  return response.status === "authenticated" ? response.session : null;
}
