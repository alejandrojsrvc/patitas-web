import "server-only";

import type { AuthResponse, AuthSession, CurrentUser } from "@/domain/auth/types";

const apiUrl = process.env.API_URL?.trim().replace(/\/$/, "");
if (!apiUrl) throw new Error("API_URL no está configurada.");
const originVerifySecret = process.env.API_ORIGIN_VERIFY_SECRET?.trim();

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
        ...(originVerifySecret ? { "X-Origin-Verify": originVerifySecret } : {}),
      },
    });
  } catch {
    throw new AuthApiError("No pudimos conectar con el servicio de cuentas. Verificá que Patitas API esté disponible.", 502);
  }
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) throw new AuthApiError(payload?.message ?? "Patitas API no pudo completar la solicitud.", response.status);
  return payload as T;
}

function turnstileHeaders(token?: string) {
  return token ? { "X-Turnstile-Token": token } : undefined;
}

export const authApi = {
  register: (input: { email: string; password: string }, turnstileToken?: string) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input), headers: turnstileHeaders(turnstileToken) }),
  login: (input: { email: string; password: string }, turnstileToken?: string) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input), headers: turnstileHeaders(turnstileToken) }),
  confirmEmail: (input: { token: string; type: "signup" | "magiclink" }) =>
    request<AuthResponse>("/auth/email-confirmation/confirm", { method: "POST", body: JSON.stringify(input) }),
  resendConfirmation: (input: { email: string }, turnstileToken?: string) =>
    request<{ message: string }>("/auth/email-confirmation/resend", {
      method: "POST",
      body: JSON.stringify(input),
      headers: turnstileHeaders(turnstileToken),
    }),
  passwordRecovery: (input: { email: string }, turnstileToken?: string) =>
    request<{ message: string }>("/auth/password-recovery", {
      method: "POST",
      body: JSON.stringify(input),
      headers: turnstileHeaders(turnstileToken),
    }),
  passwordReset: (input: { token: string; newPassword: string }) =>
    request<void>("/auth/password-reset", { method: "POST", body: JSON.stringify(input) }),
  refresh: (refreshToken: string) => request<AuthResponse>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }),
  current: (accessToken: string) => request<CurrentUser>("/me", { headers: { Authorization: `Bearer ${accessToken}` } }),
  logout: (accessToken: string) => request<void>("/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }),
};

export function sessionFromResponse(response: AuthResponse): AuthSession | null {
  return response.status === "authenticated" ? response.session : null;
}
