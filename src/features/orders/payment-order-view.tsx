"use client";

import { ArrowClockwise, ArrowLeft, CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/features/cart/cart-context";

import type { OrderSummary } from "@/domain/customer/types";
import {
  isPaymentPollingStatus,
  paymentStatusLabel,
  paymentStatusMessage,
  paymentRedirectUrl,
  pollPaymentOrder,
} from "@/features/checkout/payment-flow";
import { formatMoney } from "@/lib/catalog-formatters";

export function PaymentOrderView({ orderId, heading = "Estado de tu pedido" }: { orderId: string; heading?: string }) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const retryKeyRef = useRef<string | null>(null);
  const { refresh } = useCart();

  useEffect(() => {
    void refresh();
  }, [orderId, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setError(null);
      try {
        await pollPaymentOrder(
          async () => {
            const response = await fetch(`/api/commerce/checkout/orders/${encodeURIComponent(orderId)}`, {
              cache: "no-store",
              signal: controller.signal,
            });
            const payload = (await response.json().catch(() => null)) as OrderSummary | { message?: string } | null;
            if (!response.ok || !payload || !("id" in payload)) {
              const requestError = new Error(
                payload && "message" in payload ? payload.message : "No pudimos consultar el estado del pedido.",
              );
              Object.assign(requestError, { status: response.status });
              throw requestError;
            }
            return payload;
          },
          {
            signal: controller.signal,
            onUpdate: (nextOrder) => {
              if (!active) return;
              setOrder(nextOrder);
              setPolling(isPaymentPollingStatus(nextOrder.paymentStatus));
            },
          },
        );
        if (active) setPolling(false);
      } catch (cause) {
        if (!active || controller.signal.aborted) return;
        setPolling(false);
        setError(orderErrorMessage(cause, "No pudimos consultar el estado del pedido."));
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [orderId]);

  async function retryPayment() {
    if (!order?.canRetry || retrying) return;
    setRetrying(true);
    setError(null);
    try {
      const response = await fetch(`/api/commerce/payments/orders/${encodeURIComponent(order.id)}/link`, {
        method: "POST",
        headers: { "Idempotency-Key": retryKeyRef.current ?? (retryKeyRef.current = crypto.randomUUID()) },
      });
      const payload = (await response.json().catch(() => null)) as {
        action?: "REDIRECT" | "NONE" | "RETRY";
        paymentUrl?: string | null;
        message?: string;
      } | null;
      if (!response.ok) {
        const requestError = new Error(payload?.message ?? "No pudimos iniciar un nuevo intento de pago.");
        Object.assign(requestError, { status: response.status });
        throw requestError;
      }
      if (payload?.action === "NONE") {
        window.location.reload();
        return;
      }
      const paymentUrl =
        payload?.action && payload.paymentUrl !== undefined
          ? paymentRedirectUrl({ action: payload.action, paymentUrl: payload.paymentUrl })
          : null;
      if (!paymentUrl) throw new Error("La plataforma de pago no devolvió una URL válida.");
      window.location.assign(paymentUrl);
    } catch (cause) {
      setError(orderErrorMessage(cause, "No pudimos iniciar un nuevo intento de pago."));
      setRetrying(false);
    }
  }

  if (error && !order)
    return (
      <OrderShell>
        <p role="alert" className="rounded-xl bg-[#fff1f1] p-4 text-[#8d2020]">
          {error}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          Consultar nuevamente <ArrowClockwise size={17} />
        </button>
      </OrderShell>
    );
  if (!order)
    return (
      <OrderShell>
        <p role="status" className="text-muted">
          Consultando el estado de tu pedido…
        </p>
      </OrderShell>
    );

  const status = order.paymentStatus;
  const isPaid = status === "PAID";
  const isPending = isPaymentPollingStatus(status);
  const Icon = isPaid ? CheckCircle : isPending ? Clock : WarningCircle;
  const iconClass = isPaid ? "text-brand-blue" : isPending ? "text-[#9a6400]" : "text-[#8d2020]";

  return (
    <OrderShell>
      <Icon size={44} weight="duotone" className={iconClass} aria-hidden="true" />
      <p className={`mt-5 text-sm font-semibold ${iconClass}`} role={isPending ? "status" : undefined}>
        {paymentStatusLabel(status)}
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold">{isPaid ? "¡Gracias por tu compra!" : heading}</h2>
      <p className="mt-3 max-w-xl text-lg leading-7 text-muted">{paymentStatusMessage(status)}</p>
      <p className="mt-3 max-w-xl text-sm text-muted">Si compraste como invitado, revisá tu email: desde ahí vas a poder activar tu cuenta y consultar el pedido.</p>
      {polling ? (
        <p className="mt-4 rounded-xl bg-soft-blue p-4 text-sm text-ink" role="status">
          Estamos consultando la confirmación automáticamente.
        </p>
      ) : null}
      {!polling && isPending ? (
        <p className="mt-4 rounded-xl bg-[#fff4cf] p-4 text-sm text-[#6f4d00]" role="status">
          La confirmación está demorando más de lo habitual. Podés consultar nuevamente sin crear otro pago.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#8d2020]">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-sm text-muted">Pedido #{order.number ?? order.id}</p>
      <ul className="mt-7 divide-y divide-catalog-line border-y border-catalog-line">
        {order.lines.map((line) => (
          <li key={line.variantId} className="flex justify-between gap-4 py-4">
            <span>
              {line.quantity} × {line.productName}
            </span>
            <span className="shrink-0 tabular-nums">{formatMoney(Number(line.lineTotal))}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatMoney(Number(order.total))}</span>
      </div>
      {order.reconciliationRequired ? (
        <p role="status" className="mt-4 text-sm text-muted">
          Estamos revisando el pago. No hagas otro pago mientras confirmamos su estado.
        </p>
      ) : null}
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/perros"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-catalog-canvas px-5 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <ArrowLeft size={17} /> Seguir comprando
        </Link>
        <Link
          href={`/mi-cuenta/pedidos/${encodeURIComponent(order.id)}`}
          className="inline-flex min-h-12 items-center rounded-xl border border-catalog-line px-5 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          Ver este pedido
        </Link>
        <Link
          href="/mi-cuenta/pedidos"
          className="inline-flex min-h-12 items-center rounded-xl border border-catalog-line px-5 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          Ver mis pedidos
        </Link>
        {order.canRetry && !order.reconciliationRequired ? (
          <button
            type="button"
            onClick={() => void retryPayment()}
            disabled={retrying}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60"
          >
            <ArrowClockwise size={18} />
            {retrying ? "Abriendo pago…" : "Reintentar pago"}
          </button>
        ) : null}
        {!polling && isPending ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <ArrowClockwise size={18} /> Consultar estado
          </button>
        ) : null}
      </div>
    </OrderShell>
  );
}

function OrderShell({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-2xl rounded-xl bg-white p-7 sm:p-10">{children}</section>;
}

function orderErrorMessage(cause: unknown, fallback: string) {
  if (cause instanceof TypeError && /fetch|network|conect/i.test(cause.message)) {
    return "No pudimos conectarnos. Revisá tu conexión y volvé a intentar.";
  }
  if (cause && typeof cause === "object" && "status" in cause && typeof cause.status === "number") {
    if (cause.status === 401) return "Tu sesión expiró. Iniciá sesión nuevamente para consultar el pedido.";
    if (cause.status === 403) return "No tenés permiso para consultar este pedido con esta cuenta.";
    if (cause.status === 404) return "No encontramos este pedido. Revisá el enlace o contactanos para ayudarte.";
    if (cause.status === 429) return "Recibimos demasiadas consultas seguidas. Esperá un momento y volvé a intentar.";
    if (cause.status >= 500) return "El servicio está temporalmente ocupado. Esperá un momento y volvé a intentar.";
  }
  return cause instanceof Error && cause.message ? cause.message : fallback;
}
