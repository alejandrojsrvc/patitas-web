"use client";

import { ArrowLeft, CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { OrderSummary } from "@/domain/customer/types";
import { formatMoney } from "@/lib/catalog-formatters";

export function GuestOrderPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch(`/api/commerce/checkout/orders/${encodeURIComponent(orderId)}`)
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as OrderSummary | { message?: string } | null;
        if (!response.ok || !payload || !("id" in payload)) throw new Error(payload && "message" in payload ? payload.message : "No pudimos encontrar este pedido.");
        if (active) setOrder(payload);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "No pudimos cargar este pedido."); });
    return () => { active = false; };
  }, [orderId]);

  if (error) return <OrderState><p role="alert" className="rounded-xl bg-[#fff1f1] p-4 text-[#8d2020]">{error}</p><Link href="/perros" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-brand-blue px-5 font-semibold text-white">Volver al catálogo</Link></OrderState>;
  if (!order) return <OrderState><p className="text-muted">Cargando tu pedido…</p></OrderState>;

  return <OrderState><CheckCircle size={40} weight="duotone" className="text-brand-blue" aria-hidden="true" /><p className="mt-5 text-sm font-semibold text-brand-blue">Pedido confirmado</p><h1 className="mt-2 font-display text-3xl font-semibold">Pedido {order.id}</h1><p className="mt-2 text-muted">{new Date(order.createdAt).toLocaleDateString("es-AR")} · {orderStatus(order.status)}</p><ul className="mt-7 divide-y divide-catalog-line border-y border-catalog-line">{order.lines.map((line) => <li key={line.variantId} className="flex justify-between gap-4 py-4"><span>{line.quantity} × {line.productName}</span><span className="shrink-0 tabular-nums">{formatMoney(Number(line.lineTotal))}</span></li>)}</ul><div className="mt-5 flex justify-between font-semibold"><span>Total</span><span>{formatMoney(Number(order.total))}</span></div><Link href="/perros" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-catalog-canvas px-5 font-semibold text-ink"><ArrowLeft size={17} /> Seguir comprando</Link></OrderState>;
}

function OrderState({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-2xl rounded-xl bg-white p-7 sm:p-10">{children}</section>;
}

function orderStatus(status: string) {
  return ({ PAID: "Pagado", PROCESSING: "En preparación", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELLED: "Cancelado" } as Record<string, string>)[status] ?? status;
}
