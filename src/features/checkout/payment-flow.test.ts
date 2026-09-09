import assert from "node:assert/strict";
import test from "node:test";

import type { CheckoutConfirmResult } from "@/domain/checkout/types";
import type { OrderSummary } from "@/domain/customer/types";
import {
  checkoutAttemptKey,
  isPaymentPollingStatus,
  isIdempotencyConflict,
  isTerminalPaymentStatus,
  paymentRedirectUrl,
  paymentStatusLabel,
  paymentStatusMessage,
  pollPaymentOrder,
} from "./payment-flow.ts";

test("conserva el intento al recargar checkout y separa compras distintas", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const first = checkoutAttemptKey("checkout-1", storage);
  assert.equal(checkoutAttemptKey("checkout-1", storage), first);
  assert.notEqual(checkoutAttemptKey("checkout-2", storage), first);
});

const paymentResult = {
  order: { id: "order-1", paymentStatus: "PENDING" },
  payment: {
    provider: "mercadopago",
    action: "REDIRECT",
    paymentUrl: "https://www.mercadopago.com.ar/checkout/v1/redirect",
    externalId: "preference-1",
    status: "PENDING",
    expiresAt: null,
  },
} as unknown as CheckoutConfirmResult;

function order(paymentStatus: OrderSummary["paymentStatus"]): OrderSummary {
  const now = new Date().toISOString();
  return {
    id: "order-1",
    status: "PENDING_PAYMENT",
    paymentStatus,
    canRetry: paymentStatus === "FAILED",
    reconciliationRequired: false,
    reconciliationReason: null,
    reservationExpiresAt: null,
    subtotal: "10",
    discountTotal: "0",
    shippingCost: "0",
    total: "10",
    currency: "ARS",
    contactName: "Cliente",
    contactEmail: "cliente@example.com",
    petName: null,
    date: now,
    lines: [],
    createdAt: now,
  };
}

test("usa el contrato nuevo de Mercado Pago y su paymentUrl para REDIRECT", () => {
  const payment = paymentResult.payment;
  assert.ok(payment);
  assert.equal(payment.provider, "mercadopago");
  assert.equal(payment.action, "REDIRECT");
  assert.equal(paymentRedirectUrl(payment), payment.paymentUrl);
  assert.equal(paymentRedirectUrl({ action: "REDIRECT", paymentUrl: null }), null);
  assert.equal(paymentRedirectUrl({ action: "REDIRECT", paymentUrl: "javascript:alert(1)" }), null);
});

test("el resultado se decide por paymentStatus y no por haber vuelto a success", () => {
  assert.match(paymentStatusMessage("PENDING"), /confirmando/i);
  assert.equal(paymentStatusLabel("PAID"), "Pago aprobado");
  assert.equal(paymentStatusLabel("FAILED"), "Pago fallido");
  assert.equal(paymentStatusLabel("PARTIALLY_REFUNDED"), "Pago parcialmente reintegrado");
});

test("un conflicto de idempotencia conserva la operación existente", () => {
  assert.equal(isIdempotencyConflict({ status: 409, code: "PAYMENT_IDEMPOTENCY_CONFLICT" }), true);
  assert.equal(isIdempotencyConflict({ status: 409, code: "OTHER_CONFLICT" }), false);
});

test("PENDING y PROCESSING activan polling; PAID lo detiene", async () => {
  assert.equal(isPaymentPollingStatus("PENDING"), true);
  assert.equal(isPaymentPollingStatus("PROCESSING"), true);
  assert.equal(isTerminalPaymentStatus("PAID"), true);

  const statuses: OrderSummary["paymentStatus"][] = ["PENDING", "PAID"];
  let calls = 0;
  const result = await pollPaymentOrder(async () => order(statuses[calls++] ?? "PAID"), { intervalMs: 0, maxAttempts: 4 });
  assert.equal(calls, 2);
  assert.equal(result.paymentStatus, "PAID");
});

test("el polling se detiene en el límite", async () => {
  let calls = 0;
  const result = await pollPaymentOrder(
    async () => {
      calls += 1;
      return order("PROCESSING");
    },
    { intervalMs: 0, maxAttempts: 3 },
  );
  assert.equal(calls, 3);
  assert.equal(result.paymentStatus, "PROCESSING");
});

test("el polling se detiene al desmontar mediante AbortSignal", async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = pollPaymentOrder(
    async () => {
      calls += 1;
      return order("PENDING");
    },
    { intervalMs: 20, maxAttempts: 12, signal: controller.signal },
  );
  controller.abort();
  const result = await pending;
  assert.equal(calls, 1);
  assert.equal(result.paymentStatus, "PENDING");
});
