"use client";

import { ArrowClockwise, ArrowLeft, CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setError(null);
      try {
        await pollPaymentOrder(
          async () => {
            const response = await fetch(`/api/commerce/checkout/orders/${encodeURIComponent(orderId)}`, { cache: "no-store", signal: controller.signal });
            const payload = await response.json().catch(() => null) as OrderSummary | { message?: string } | null;
            if (!response.ok || !payload || !("id" in payload)) throw new Error(payload && "message" in payload ? payload.message : "No pudimos consultar el estado del pedido.");
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
        setError(cause instanceof Error ? cause.message : "No pudimos consultar el estado del pedido.");
      }
    }

    void load();
    return () => { active = false; controller.abort(); };
  }, [orderId]);

  async function retryPayment() {
    if (!order?.canRetry || retrying) return;
    setRetrying(true);
    setError(null);
    try {
      const response = await fetch(`/api/commerce/payments/orders/${encodeURIComponent(order.id)}/link`, { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() } });
      const payload = await response.json().catch(() => null) as { action?: "REDIRECT" | "NONE" | "RETRY"; paymentUrl?: string | null; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? "No pudimos iniciar un nuevo intento de pago.");
      const paymentUrl = payload?.action && payload.paymentUrl !== undefined ? paymentRedirectUrl({ action: payload.action, paymentUrl: payload.paymentUrl }) : null;
      if (!paymentUrl) throw new Error("La plataforma de pago no devolvió una URL válida.");
      window.location.assign(paymentUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos iniciar un nuevo intento de pago.");
      setRetrying(false);
    }
  }

  if (error && !order) return <OrderShell><p role="alert" className="rounded-xl bg-[#fff1f1] p-4 text-[#8d2020]">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">Consultar nuevamente <ArrowClockwise size={17} /></button></OrderShell>;
  if (!order) return <OrderShell><p role="status" className="text-muted">Consultando el estado de tu pedido…</p></OrderShell>;

  const status = order.paymentStatus;
  const isPaid = status === "PAID";
  const isPending = isPaymentPollingStatus(status);
  const Icon = isPaid ? CheckCircle : isPending ? Clock : WarningCircle;
  const iconClass = isPaid ? "text-brand-blue" : isPending ? "text-[#9a6400]" : "text-[#8d2020]";

  return <OrderShell>
    <Icon size={44} weight="duotone" className={iconClass} aria-hidden="true" />
    <p className={`mt-5 text-sm font-semibold ${iconClass}`} role={isPending ? "status" : undefined}>{paymentStatusLabel(status)}</p>
    <h1 className="mt-2 font-display text-3xl font-semibold">{heading}</h1>
    <p className="mt-3 max-w-xl text-lg leading-7 text-muted">{paymentStatusMessage(status)}</p>
    {polling ? <p className="mt-4 rounded-xl bg-soft-blue p-4 text-sm text-ink" role="status">Estamos confirmando tu pago. Volvemos a consultar automáticamente durante unos minutos.</p> : null}
    {!polling && isPending ? <p className="mt-4 rounded-xl bg-[#fff4cf] p-4 text-sm text-[#6f4d00]" role="status">La confirmación está demorando más de lo habitual. Podés consultar nuevamente sin crear otro pago.</p> : null}
    {error ? <p role="alert" className="mt-4 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#8d2020]">{error}</p> : null}
    <p className="mt-4 text-sm text-muted">Pedido {order.id}</p>
    <ul className="mt-7 divide-y divide-catalog-line border-y border-catalog-line">{order.lines.map((line) => <li key={line.variantId} className="flex justify-between gap-4 py-4"><span>{line.quantity} × {line.productName}</span><span className="shrink-0 tabular-nums">{formatMoney(Number(line.lineTotal))}</span></li>)}</ul>
    <div className="mt-5 flex justify-between font-semibold"><span>Total</span><span>{formatMoney(Number(order.total))}</span></div>
    <div className="mt-7 flex flex-wrap gap-3"><Link href="/perros" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-catalog-canvas px-5 font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"><ArrowLeft size={17} /> Seguir comprando</Link>{order.canRetry && !order.reconciliationRequired ? <button type="button" onClick={() => void retryPayment()} disabled={retrying} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:opacity-60"><ArrowClockwise size={18} />{retrying ? "Abriendo pago…" : "Reintentar pago"}</button> : null}{!polling && isPending ? <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"><ArrowClockwise size={18} /> Consultar estado</button> : null}</div>
  </OrderShell>;
}

function OrderShell({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-2xl rounded-xl bg-white p-7 sm:p-10">{children}</section>;
}
