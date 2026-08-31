"use client";

import { ArrowRight, Minus, Plus, Trash, Truck, WarningCircle } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

import { ProductImage } from "@/components/catalog/product-image";
import { formatMoney } from "@/lib/catalog-formatters";
import { useCart } from "./cart-context";

export function CartPageContent({ checkoutMessage }: { checkoutMessage?: string }) {
  const { items, subtotal, updateQuantity, removeItem, refresh, loading, error } = useCart();

  if (loading && !items.length) return <section className="rounded-xl bg-white p-8 text-center text-muted">Cargando tu carrito…</section>;

  if (error && !items.length) {
    return <section className="rounded-xl bg-white px-6 py-12 text-center sm:px-12 sm:py-16" role="alert"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#fff1f1] text-[#8d2020]"><WarningCircle size={28} weight="duotone" aria-hidden="true" /></div><h2 className="mt-5 font-display text-3xl font-semibold">No pudimos cargar tu carrito</h2><p className="mx-auto mt-2 max-w-md text-muted">{checkoutMessage ?? error}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={() => void refresh()} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-5 font-semibold text-white hover:bg-[#0048dc]">Reintentar</button><Link href="/mi-cuenta" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-catalog-canvas px-5 font-semibold text-ink hover:text-brand-blue">Revisar sesión</Link></div></section>;
  }

  if (!items.length) {
    return (
      <section className="rounded-xl bg-white px-6 py-12 text-center sm:px-12 sm:py-16">
        {checkoutMessage ? <p role="alert" className="mx-auto mb-6 max-w-md rounded-lg bg-[#fff8e5] p-3 text-sm text-[#765400]">{checkoutMessage}</p> : null}
        <Image src="/brand/patitas-isotipo.png" alt="" width={736} height={876} className="mx-auto h-20 w-auto opacity-35" />
        <h2 className="mt-5 font-display text-3xl font-semibold">Tu carrito está vacío</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">Elegí lo que consume tu perro o gato y volvé cuando quieras.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/perros" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-5 font-semibold text-white hover:bg-[#0048dc]">Comprar para perros</Link>
          <Link href="/gatos" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-catalog-canvas px-5 font-semibold text-ink hover:text-brand-blue">Comprar para gatos</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      {checkoutMessage ? <p role="alert" className="col-span-full rounded-lg bg-[#fff8e5] p-3 text-sm text-[#765400]">{checkoutMessage}</p> : null}
      <section aria-labelledby="cart-items-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="cart-items-title" className="font-display text-2xl font-semibold">Tu selección</h2>
            <p className="mt-1 text-sm text-muted" aria-live="polite">{items.reduce((total, item) => total + item.quantity, 0)} unidades</p>
          </div>
          <Link href="/perros" className="text-sm font-semibold text-brand-blue hover:underline">Seguir comprando</Link>
        </div>

        <div className="overflow-hidden rounded-xl bg-white">
          {items.map((item) => (
            <article key={item.variantId} className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-catalog-line p-3 last:border-b-0 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:p-5">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
                <ProductImage src={item.imageUrl} alt={item.productName} className="p-2" />
              </div>
              <div className="min-w-0">
                <Link href={`/producto/${item.slug}`} className="mt-1 block font-display text-lg font-semibold leading-5 hover:text-brand-blue sm:text-xl sm:leading-6">{item.productName}</Link>
                <p className="mt-1 text-sm text-muted">{item.presentation ?? "Presentación estándar"}</p>
                <p className="mt-1 text-sm text-muted">{formatMoney(Number(item.unitPrice))} por unidad</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-lg bg-catalog-canvas" aria-label={`Cantidad de ${item.productName}`}>
                    <button type="button" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} aria-label="Restar una unidad" className="flex size-10 items-center justify-center rounded-lg hover:bg-brand-blue/10"><Minus size={15} weight="bold" /></button>
                    <span className="w-9 text-center text-sm font-semibold tabular-nums" aria-live="polite">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.variantId, item.quantity + 1)} aria-label="Sumar una unidad" className="flex size-10 items-center justify-center rounded-lg hover:bg-brand-blue/10"><Plus size={15} weight="bold" /></button>
                  </div>
                  <button type="button" onClick={() => removeItem(item.variantId)} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-[#8d2020]"><Trash size={16} aria-hidden="true" /> Quitar</button>
                </div>
              </div>
              <p className="col-span-2 font-display text-lg font-semibold tabular-nums sm:col-span-1 sm:text-right sm:text-xl">{formatMoney(Number(item.lineTotal))}</p>
            </article>
          ))}
        </div>
        {error ? <p role="alert" className="mt-4 rounded-lg bg-[#fff1f1] p-3 text-sm text-[#8d2020]">{error}</p> : null}
      </section>

      <aside className="h-fit rounded-xl bg-white p-5 sm:p-6" aria-labelledby="cart-summary-title">
        <h2 id="cart-summary-title" className="font-display text-2xl font-semibold">Resumen</h2>
        <div className="mt-5 flex items-center justify-between border-b border-catalog-line pb-5">
          <span className="text-muted">Subtotal</span>
          <strong className="font-display text-2xl tabular-nums">{formatMoney(subtotal)}</strong>
        </div>
        <div className="mt-5 flex gap-3 rounded-lg bg-catalog-canvas p-3 text-sm text-muted">
          <Truck size={20} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
          <p>En el siguiente paso confirmamos cobertura, disponibilidad y costo de envío con tu dirección.</p>
        </div>
        <Link href="/checkout/iniciar" prefetch={false} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white hover:bg-[#0048dc]">Continuar al checkout <ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>
      </aside>
    </div>
  );
}
