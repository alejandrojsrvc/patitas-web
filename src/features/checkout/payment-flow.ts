import type { OrderSummary } from "@/domain/customer/types";

export const PAYMENT_POLL_INTERVAL = 5_000;
export const PAYMENT_POLL_LIMIT = 12;

export type PaymentStatus = NonNullable<OrderSummary["paymentStatus"]>;

export function checkoutAttemptKey(sessionId: string, storage?: Pick<Storage, "getItem" | "setItem">) {
  const key = `patitas-checkout-attempt:${sessionId}`;
  try {
    const existing = storage?.getItem(key);
    if (existing) return existing;
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
  const value = crypto.randomUUID();
  try {
    storage?.setItem(key, value);
  } catch {
    /* The caller also keeps it in memory. */
  }
  return value;
}

const pollingStatuses = new Set<PaymentStatus>(["PENDING", "PROCESSING"]);
const terminalStatuses = new Set<PaymentStatus>(["UNPAID", "PAID", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED", "CHARGED_BACK"]);

export function isPaymentPollingStatus(status: PaymentStatus) {
  return pollingStatuses.has(status);
}

export function isTerminalPaymentStatus(status: PaymentStatus) {
  return terminalStatuses.has(status);
}

export function isIdempotencyConflict(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 409 &&
    "code" in error &&
    error.code === "PAYMENT_IDEMPOTENCY_CONFLICT",
  );
}

export function paymentRedirectUrl(payment: { action: "REDIRECT" | "NONE" | "RETRY"; paymentUrl: string | null }) {
  if (payment.action !== "REDIRECT" || !payment.paymentUrl) return null;
  try {
    const url = new URL(payment.paymentUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function paymentStatusLabel(status: PaymentStatus) {
  return (
    (
      {
        UNPAID: "Pago no iniciado",
        PENDING: "Pago pendiente",
        PROCESSING: "Estamos confirmando tu pago",
        PAID: "Pago aprobado",
        FAILED: "Pago fallido",
        PARTIALLY_REFUNDED: "Pago parcialmente reintegrado",
        REFUNDED: "Pago reintegrado",
        CHARGED_BACK: "Pago desconocido por el banco",
      } as Record<string, string>
    )[status] ?? "Estado de pago no disponible"
  );
}

export function paymentStatusMessage(status: PaymentStatus) {
  if (isPaymentPollingStatus(status)) return "Estamos confirmando tu pago con Mercado Pago. No hace falta volver a pagar.";
  if (status === "PAID") return "Tu pago fue aprobado y recibimos tu pedido.";
  if (status === "FAILED") return "El pago fue rechazado o no pudo completarse. Podés revisar el pedido o intentar nuevamente.";
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") return "El estado del reintegro fue actualizado por la pasarela.";
  if (status === "CHARGED_BACK") return "El pago fue desconocido por el banco y requiere revisión.";
  return "La orden todavía no registra un pago confirmado.";
}

export async function pollPaymentOrder(
  fetchOrder: () => Promise<OrderSummary>,
  options: {
    intervalMs?: number;
    maxAttempts?: number;
    signal?: AbortSignal;
    onUpdate?: (order: OrderSummary) => void;
  } = {},
) {
  const intervalMs = options.intervalMs ?? PAYMENT_POLL_INTERVAL;
  const maxAttempts = Math.max(1, options.maxAttempts ?? PAYMENT_POLL_LIMIT);
  let order = await fetchOrder();
  options.onUpdate?.(order);

  for (let attempt = 1; attempt < maxAttempts && isPaymentPollingStatus(order.paymentStatus); attempt += 1) {
    await waitForNextPoll(intervalMs, options.signal);
    if (options.signal?.aborted) return order;
    order = await fetchOrder();
    options.onUpdate?.(order);
  }

  return order;
}

function waitForNextPoll(intervalMs: number, signal?: AbortSignal) {
  if (signal?.aborted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = () => {
      globalThis.clearTimeout(timer);
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const timer = globalThis.setTimeout(finish, intervalMs);
    signal?.addEventListener("abort", finish, { once: true });
  });
}
