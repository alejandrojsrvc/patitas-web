import type { AccountScreen } from "@/domain/storefront/types";
import type { AccountRequest } from "./account-routing";

export class AccountApiError extends Error {
  public readonly status: number;

  public constructor(message: string, status: number) {
    super(message);
    this.name = "AccountApiError";
    this.status = status;
  }
}

export async function requestAccountScreen(request: AccountRequest): Promise<AccountScreen> {
  const params = new URLSearchParams({ section: request.section });
  if (request.orderId) params.set("orderId", request.orderId);
  if (request.page) params.set("page", String(request.page));
  if (request.perPage) params.set("perPage", String(request.perPage));

  const response = await fetch(`/api/commerce/me/account?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as AccountScreen | { message?: string } | null;

  if (!response.ok || !isAccountScreen(payload, request)) {
    throw new AccountApiError(
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : response.ok
          ? "Algo salió mal al cargar estos datos. Volvé a intentarlo."
          : "No pudimos cargar esta sección. Revisá tu conexión y volvé a intentarlo.",
      response.ok ? 502 : response.status,
    );
  }

  return payload;
}

export async function requestAccountJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/commerce${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    throw new AccountApiError(
      payload && typeof payload === "object" && "message" in payload && payload.message
        ? payload.message
        : "No pudimos completar la acción. Revisá tu conexión y volvé a intentarlo.",
      response.status,
    );
  }

  return payload as T;
}

export function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

function isAccountScreen(value: unknown, request: AccountRequest): value is AccountScreen {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AccountScreen>;
  if (!candidate.shell || !candidate.profile || !candidate.section) return false;
  const expectedType =
    request.section === "orders" && request.orderId
      ? "order-detail"
      : ({ overview: "overview", orders: "orders", addresses: "addresses", pets: "pets", replenishments: "replenishments" } as const)[
          request.section
        ];
  return candidate.section.type === expectedType;
}
