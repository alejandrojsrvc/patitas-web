"use client";

import { Calculator, Info } from "@phosphor-icons/react";
import { useMemo, useState, type FormEvent } from "react";
import type { FoodDurationResult, Product } from "@/domain/catalog/types";
import { formatWeight } from "@/lib/catalog-formatters";
import { selectInitialVariant } from "@/lib/catalog-variants";

const consentVersion = "2026-08-26";

export function FoodCalculator({ products }: { products: Product[] }) {
  const [productSlug, setProductSlug] = useState(products[0]?.slug ?? "");
  const product = useMemo(() => products.find((item) => item.slug === productSlug) ?? products[0], [productSlug, products]);
  const [variantId, setVariantId] = useState(product ? selectInitialVariant(product)?.id ?? "" : "");
  const [weight, setWeight] = useState("");
  const [lifeStage, setLifeStage] = useState(product?.lifeStage ?? "adult");
  const [result, setResult] = useState<FoodDurationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [leadStatus, setLeadStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [leadError, setLeadError] = useState<string | null>(null);

  function selectProduct(slug: string) {
    const next = products.find((item) => item.slug === slug);
    setProductSlug(slug);
    setVariantId(next ? selectInitialVariant(next)?.id ?? "" : "");
    setLifeStage(next?.lifeStage ?? "adult");
    setResult(null);
    setError(null);
    setLeadStatus("idle");
    setLeadError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !variantId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLeadStatus("idle");
    setLeadError(null);
    try {
      const response = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: product.slug, variantId, petWeightKg: Number(weight.replace(",", ".")), lifeStage }),
      });
      const payload = await response.json() as FoodDurationResult | { message: string };
      if (!response.ok) throw new Error("message" in payload ? payload.message : "No pudimos calcular la duración.");
      setResult(payload as FoodDurationResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos calcular la duración.");
    } finally {
      setLoading(false);
    }
  }

  async function captureLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !result || !emailConsent) return;
    setLeadStatus("submitting");
    setLeadError(null);
    try {
      const response = await fetch("/api/replenishment-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          variantId,
          petWeightKg: Number(weight.replace(",", ".")),
          lifeStage,
          estimatedDurationDays: result.durationDays,
          calculationSource: result.sourceLabel,
          email: email.trim(),
          whatsapp: whatsapp.trim() || undefined,
          consent: { email: emailConsent, whatsapp: Boolean(whatsapp.trim() && whatsappConsent), version: consentVersion },
        }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "No pudimos guardar tu aviso de reposición.");
      setLeadStatus("success");
    } catch (cause) {
      setLeadStatus("error");
      setLeadError(cause instanceof Error ? cause.message : "No pudimos guardar tu aviso de reposición.");
    }
  }

  if (!products.length) return <div className="rounded-2xl bg-soft-yellow p-6"><h2 className="font-display text-2xl font-semibold">La calculadora espera el catálogo</h2><p className="mt-2 text-muted">Para calcular necesitamos al menos un alimento activo con presentación, precio y factor general configurado en Patitas API.</p></div>;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_16px_50px_rgba(23,23,23,0.08)] sm:p-8">
      <form onSubmit={submit}>
      <div className="grid gap-5">
        <label className="font-semibold">Alimento<select value={product?.slug} onChange={(event) => selectProduct(event.target.value)} className="mt-2 h-13 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue">{products.map((item) => <option key={item.id} value={item.slug}>{item.brand.name} · {item.name}</option>)}</select></label>
        <label className="font-semibold">Presentación<select value={variantId} onChange={(event) => { setVariantId(event.target.value); setResult(null); setLeadStatus("idle"); }} className="mt-2 h-13 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue">{product?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.presentation ?? formatWeight(variant.weightGrams) ?? "Presentación"}</option>)}</select></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="font-semibold">Peso de tu mascota<input name="weight" value={weight} onChange={(event) => setWeight(event.target.value)} required min="0.1" step="0.1" inputMode="decimal" placeholder="Ej. 12 kg" className="mt-2 h-13 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-brand-blue" /></label>
          <label className="font-semibold">Etapa<select name="lifeStage" value={lifeStage} onChange={(event) => setLifeStage(event.target.value)} className="mt-2 h-13 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue"><option value="puppy">Cachorro</option><option value="kitten">Gatito</option><option value="adult">Adulto</option><option value="senior">Senior</option></select></label>
        </div>
      </div>
      <button type="submit" disabled={loading || !variantId} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white hover:bg-[#0048dc] disabled:opacity-60"><Calculator size={20} weight="bold" />{loading ? "Calculando…" : "Calcular cuánto dura"}</button>
      {error ? <p role="alert" className="mt-5 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#8d2020]">{error}</p> : null}
      </form>
      {result ? <section className="mt-6 border-t border-border pt-6" aria-live="polite"><p className="text-sm text-muted">Duración estimada</p><p className="mt-1 font-display text-5xl font-semibold text-brand-blue">≈ {result.durationDays.min === result.durationDays.max ? Math.round(result.durationDays.min) : `${Math.round(result.durationDays.min)}–${Math.round(result.durationDays.max)}`} días</p><div className={`mt-5 flex items-start gap-3 rounded-xl p-4 ${result.isFallback ? "bg-soft-yellow" : "bg-soft-blue"}`}><Info size={21} className="mt-0.5 shrink-0" /><div><p className="font-semibold">{result.sourceLabel}</p><p className="mt-1 text-sm text-muted">{result.isFallback ? "No encontramos una tabla aplicable del fabricante. Usamos una estimación general y la marcamos como tal." : "Calculado con la tabla cargada del fabricante."}</p></div></div><div className="mt-6 rounded-2xl bg-ink p-5 text-white"><h2 className="font-display text-2xl font-semibold">¿Querés que te avisemos cuándo reponer?</h2><p className="mt-2 text-sm leading-6 text-white/70">Guardamos tu cálculo para avisarte antes de que esta presentación pueda terminarse. El aviso no genera una compra automática.</p><form onSubmit={captureLead} className="mt-5 grid gap-3"><label className="text-sm font-semibold">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1 h-11 w-full rounded-lg border border-white/20 bg-white px-3 font-normal text-ink outline-none focus:border-brand-yellow" /></label><label className="text-sm font-semibold">WhatsApp <span className="font-normal text-white/60">(opcional)</span><input type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} autoComplete="tel" placeholder="11 1234-5678" className="mt-1 h-11 w-full rounded-lg border border-white/20 bg-white px-3 font-normal text-ink outline-none focus:border-brand-yellow" /></label><label className="flex items-start gap-2 text-xs leading-5 text-white/70"><input type="checkbox" required checked={emailConsent} onChange={(event) => setEmailConsent(event.target.checked)} className="mt-1 size-4 accent-brand-yellow" />Quiero recibir el aviso de reposición por email.</label>{whatsapp.trim() ? <label className="flex items-start gap-2 text-xs leading-5 text-white/70"><input type="checkbox" checked={whatsappConsent} onChange={(event) => setWhatsappConsent(event.target.checked)} className="mt-1 size-4 accent-brand-yellow" />También quiero recibirlo por WhatsApp.</label> : null}<button type="submit" disabled={leadStatus === "submitting" || leadStatus === "success"} className="mt-2 min-h-12 rounded-xl bg-brand-yellow px-5 font-semibold text-ink disabled:opacity-60">{leadStatus === "submitting" ? "Guardando aviso…" : leadStatus === "success" ? "Aviso solicitado" : "Avisarme cuando reponer"}</button>{leadStatus === "success" ? <p role="status" className="text-sm text-white/80">Listo. Te avisaremos con la información de reposición disponible.</p> : null}{leadError ? <p role="alert" className="text-sm text-[#ffd1d1]">{leadError}</p> : null}</form></div></section> : null}
    </div>
  );
}
