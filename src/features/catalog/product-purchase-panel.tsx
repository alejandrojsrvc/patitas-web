"use client";

import { Calculator, Info, Minus, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { FoodDurationResult, Product } from "@/domain/catalog/types";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import { formatMoney, fulfillmentCopy, pricePerKilogram } from "@/lib/catalog-formatters";
import { selectInitialVariant, variantLabel } from "@/lib/catalog-variants";
import { productDisplayName } from "@/lib/product-seo";

export function ProductPurchasePanel({ product, selectedVariantId, onSelectedVariantChange }: { product: Product; selectedVariantId?: string; onSelectedVariantChange?: (variantId: string) => void }) {
  const displayName = productDisplayName(product);
  const [variantId, setVariantId] = useState(selectInitialVariant(product)?.id ?? "");
  const [result, setResult] = useState<FoodDurationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const activeVariantId = selectedVariantId ?? variantId;
  const variant = useMemo(() => product.variants.find((item) => item.id === activeVariantId) ?? selectInitialVariant(product), [product, activeVariantId]);
  if (!variant) return <p className="rounded-xl bg-soft-yellow p-5">Este producto todavía no tiene una presentación vendible.</p>;
  const unitPrice = pricePerKilogram(variant);

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null); setResult(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/calculator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productSlug: product.slug, variantId: variant.id, petWeightKg: Number(data.get("weight")), lifeStage: data.get("lifeStage") }) });
      const payload = await response.json() as FoodDurationResult | { message: string };
      if (!response.ok) throw new Error("message" in payload ? payload.message : "No pudimos hacer el cálculo.");
      setResult(payload as FoodDurationResult);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos hacer el cálculo."); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <Link href={`/marcas/${product.brand.slug}`} className="text-sm font-bold uppercase tracking-[0.08em] text-brand-blue hover:underline">{product.brand.name}</Link>
      <h1 className="display-heading mt-2 text-3xl sm:text-5xl">{displayName}</h1>
      <p className="mt-4 text-base leading-7 text-muted sm:mt-5 sm:text-lg sm:leading-8">{product.description ?? `Conocé ${displayName}, sus presentaciones disponibles y la información necesaria para elegirlo para tu mascota.`}</p>
      <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold">Presentación</legend><div className="grid gap-2 sm:flex sm:flex-wrap">{product.variants.map((item) => <label key={item.id} className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-semibold sm:px-4 ${item.id === variant.id ? "border-brand-yellow bg-brand-yellow text-ink" : "border-border bg-white"}`}><input type="radio" name="variant" value={item.id} checked={item.id === variant.id} onChange={() => { setVariantId(item.id); onSelectedVariantChange?.(item.id); setQuantity(1); setResult(null); }} className="sr-only" /><span>{variantLabel(item)}</span><span className={`text-xs font-normal ${item.fulfillment.purchasable ? "text-[#17643a]" : "text-muted"}`}>{fulfillmentCopy(item)}</span></label>)}</div></fieldset>
      <div className="mt-6 flex flex-col items-start gap-2 border-y border-border py-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4"><div><p className="font-display text-3xl font-semibold tabular-nums sm:text-4xl">{formatMoney(variant.salePrice)}</p>{variant.compareAtPrice ? <p className="text-sm tabular-nums text-muted line-through">{formatMoney(variant.compareAtPrice)}</p> : null}{unitPrice ? <p className="text-sm tabular-nums text-muted">{formatMoney(unitPrice)}/kg</p> : null}</div><p className={`text-sm font-semibold ${variant.fulfillment.purchasable ? "text-[#17643a]" : "text-muted"}`}>{fulfillmentCopy(variant)}</p></div>
      {product.offers.length ? <div className="mt-5 grid gap-2">{product.offers.map((offer) => <div key={offer.id} className="rounded-xl bg-soft-yellow px-4 py-3 text-sm"><strong>{offer.name}</strong><span className="ml-2 text-muted">{offer.type === "PERCENTAGE" ? `${offer.value}% de descuento` : offer.value}</span></div>)}</div> : null}
      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex items-center rounded-xl border border-border bg-white" aria-label="Cantidad">
        <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Restar una unidad" className="flex size-12 items-center justify-center hover:bg-catalog-soft"><Minus size={16} weight="bold" /></button>
          <span className="w-10 text-center font-semibold tabular-nums" aria-live="polite">{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => Math.min(99, value + 1))} aria-label="Sumar una unidad" className="flex size-12 items-center justify-center hover:bg-catalog-soft"><Plus size={16} weight="bold" /></button>
        </div>
        <AddToCartButton variant={variant} quantity={quantity} />
      </div>
      {variant.weightGrams ? <form onSubmit={calculate} className="mt-8 rounded-2xl border border-catalog-line bg-white p-5 sm:mt-9 sm:p-7"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-brand-yellow text-ink"><Calculator size={21} weight="duotone" /></span><h2 className="font-display text-xl font-semibold sm:text-2xl">¿Cuánto le duraría?</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Peso de tu mascota<input name="weight" inputMode="decimal" required min="0.1" step="0.1" placeholder="Ej. 12 kg" className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue" /></label><label className="text-sm font-semibold">Etapa<select name="lifeStage" defaultValue={product.lifeStage ?? "adult"} className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue"><option value="puppy">Cachorro</option><option value="kitten">Gatito</option><option value="adult">Adulto</option><option value="senior">Senior</option></select></label></div><button type="submit" disabled={loading} className="mt-4 min-h-12 rounded-xl bg-ink px-5 font-semibold text-white hover:bg-brand-blue disabled:opacity-60">{loading ? "Calculando…" : "Calcular duración"}</button>{error ? <p role="alert" className="mt-4 rounded-xl bg-white p-4 text-sm text-[#9b2c2c]">{error}</p> : null}{result ? <div className="mt-5 rounded-xl bg-white p-5" aria-live="polite"><p className="text-sm text-muted">Duración estimada</p><p className="mt-1 font-display text-4xl font-semibold text-brand-blue">≈ {result.durationDays.min === result.durationDays.max ? Math.round(result.durationDays.min) : `${Math.round(result.durationDays.min)}–${Math.round(result.durationDays.max)}`} días</p><p className="mt-3 flex items-start gap-2 text-sm text-muted"><Info size={18} className="mt-0.5 shrink-0" />{result.sourceLabel}{result.isFallback ? " · Estimación general" : " · Tabla del fabricante"}</p>{result.assumptions.map((assumption) => <p key={assumption} className="mt-2 text-xs text-muted">{assumption}</p>)}</div> : null}</form> : null}
    </div>
  );
}
