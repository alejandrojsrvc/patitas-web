"use client";

import { Calculator, Info } from "@phosphor-icons/react";
import { FormEvent, useMemo, useState } from "react";
import type { FoodDurationResult, Product } from "@/domain/catalog/types";
import { formatWeight } from "@/lib/catalog-formatters";

export function FoodCalculator({ products }: { products: Product[] }) {
  const [productSlug, setProductSlug] = useState(products[0]?.slug ?? "");
  const product = useMemo(() => products.find((item) => item.slug === productSlug) ?? products[0], [productSlug, products]);
  const [variantId, setVariantId] = useState(product?.variants[0]?.id ?? "");
  const [result, setResult] = useState<FoodDurationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function selectProduct(slug: string) {
    const next = products.find((item) => item.slug === slug);
    setProductSlug(slug); setVariantId(next?.variants[0]?.id ?? ""); setResult(null); setError(null);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!product) return;
    setLoading(true); setError(null); setResult(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/calculator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productSlug: product.slug, variantId, petWeightKg: Number(data.get("weight")), lifeStage: data.get("lifeStage") }) });
      const payload = await response.json() as FoodDurationResult | { message: string };
      if (!response.ok) throw new Error("message" in payload ? payload.message : "No pudimos calcular la duración.");
      setResult(payload as FoodDurationResult);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos calcular la duración."); }
    finally { setLoading(false); }
  }
  if (!products.length) return <div className="rounded-2xl bg-soft-yellow p-6"><h2 className="font-display text-2xl font-semibold">La calculadora espera el catálogo</h2><p className="mt-2 text-muted">Para calcular necesitamos al menos un alimento activo con presentación, precio y factor general configurado en Patitas API.</p></div>;

  return <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-[0_16px_50px_rgba(23,23,23,0.08)] sm:p-8"><div className="grid gap-5"><label className="font-semibold">Alimento<select value={product?.slug} onChange={(event) => selectProduct(event.target.value)} className="mt-2 h-13 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue">{products.map((item) => <option key={item.id} value={item.slug}>{item.brand.name} · {item.name}</option>)}</select></label><label className="font-semibold">Presentación<select value={variantId} onChange={(event) => { setVariantId(event.target.value); setResult(null); }} className="mt-2 h-13 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue">{product?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.presentation ?? formatWeight(variant.weightGrams) ?? "Presentación"}</option>)}</select></label><div className="grid gap-5 sm:grid-cols-2"><label className="font-semibold">Peso de tu mascota<input name="weight" required min="0.1" step="0.1" inputMode="decimal" placeholder="Ej. 12 kg" className="mt-2 h-13 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-brand-blue" /></label><label className="font-semibold">Etapa<select name="lifeStage" defaultValue={product?.lifeStage ?? "adult"} className="mt-2 h-13 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue"><option value="puppy">Cachorro</option><option value="kitten">Gatito</option><option value="adult">Adulto</option><option value="senior">Senior</option></select></label></div></div><button type="submit" disabled={loading || !variantId} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white hover:bg-[#0048dc] disabled:opacity-60"><Calculator size={20} weight="bold" />{loading ? "Calculando…" : "Calcular cuánto dura"}</button>{error ? <p role="alert" className="mt-5 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#8d2020]">{error}</p> : null}{result ? <section className="mt-6 border-t border-border pt-6" aria-live="polite"><p className="text-sm text-muted">Duración estimada</p><p className="mt-1 font-display text-5xl font-semibold text-brand-blue">≈ {result.durationDays.min === result.durationDays.max ? Math.round(result.durationDays.min) : `${Math.round(result.durationDays.min)}–${Math.round(result.durationDays.max)}`} días</p><div className={`mt-5 flex items-start gap-3 rounded-xl p-4 ${result.isFallback ? "bg-soft-yellow" : "bg-soft-blue"}`}><Info size={21} className="mt-0.5 shrink-0" /><div><p className="font-semibold">{result.sourceLabel}</p><p className="mt-1 text-sm text-muted">{result.isFallback ? "No encontramos una tabla aplicable del fabricante. Usamos una estimación general y la marcamos como tal." : "Calculado con la tabla cargada del fabricante."}</p></div></div></section> : null}</form>;
}
