import "server-only";

const apiUrl = (process.env.PATITAS_API_URL ?? "http://127.0.0.1:3000/api/v1").replace(/\/$/, "");
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
    },
  });
}
