import "server-only";

const apiUrl = process.env.API_URL?.trim().replace(/\/$/, "");
if (!apiUrl) throw new Error("API_URL no está configurada.");
const originVerifySecret = process.env.API_ORIGIN_VERIFY_SECRET?.trim();
const requestTimeoutMs = 15_000;

export function requestCommerce(path: string, init?: RequestInit) {
  return fetch(`${apiUrl}${path}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(requestTimeoutMs),
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
      ...(originVerifySecret ? { "X-Origin-Verify": originVerifySecret } : {}),
    },
  });
}
