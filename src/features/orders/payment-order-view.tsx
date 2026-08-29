"use client";

import { ArrowLeft, CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { OrderSummary } from "@/domain/customer/types";
import {
  isPaymentPollingStatus,
  paymentStatusLabel,
  paymentStatusMessage,
  pollPaymentOrder,
} from "@/features/checkout/payment-flow";
import { formatMoney } from "@/lib/catalog-formatters";

export function PaymentOrderView({ orderId, heading = "Estado de tu pedido" }: { orderId: string; heading?: string }) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

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
      } catch (cause) {
        if (!active || controller.signal.aborted) return;
        setPolling(false);
        setError(cause instanceof Error ? cause.message : "No pudimos consultar el estado del pedido.");
      }
    }

    void load();
    return () => { active = false; controller.abort(); };
  }, [orderId]);

  if (error) return <OrderShell><p role="alert" className="rounded-xl bg-[#fff1f1] p-4 text-[#8d2020]">{error}</p><Link href="/carrito" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white">Volver al carrito <ArrowLeft size={17} /></Link></OrderShell>;
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
    <p className="mt-4 text-sm text-muted">Pedido {order.id}</p>
    <ul className="mt-7 divide-y divide-catalog-line border-y border-catalog-line">{order.lines.map((line) => <li key={line.variantId} className="flex justify-between gap-4 py-4"><span>{line.quantity} × {line.productName}</span><span className="shrink-0 tabular-nums">{formatMoney(Number(line.lineTotal))}</span></li>)}</ul>
    <div className="mt-5 flex justify-between font-semibold"><span>Total</span><span>{formatMoney(Number(order.total))}</span></div>
    <div className="mt-7 flex flex-wrap gap-3"><Link href="/perros" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-catalog-canvas px-5 font-semibold text-ink"><ArrowLeft size={17} /> Seguir comprando</Link>{!isPaid && !isPending ? <Link href="/carrito" className="inline-flex min-h-12 items-center rounded-xl bg-brand-blue px-5 font-semibold text-white">Volver al carrito</Link> : null}</div>
  </OrderShell>;
}

function OrderShell({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-2xl rounded-xl bg-white p-7 sm:p-10">{children}</section>;
}
