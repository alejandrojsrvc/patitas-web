"use client";

import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Cat,
  Check,
  Dog,
  Info,
  Package,
  PawPrint,
} from "@phosphor-icons/react";
import { useMemo, useState, type FormEvent } from "react";
import type { FoodDurationResult, Product } from "@/domain/catalog/types";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import { formatMoney, formatWeight } from "@/lib/catalog-formatters";

type LandingPlanQuizProps = {
  products: Product[];
};

type QuizStep = 1 | 2 | 3;
type Species = "dog" | "cat";

const lifeStages = [
  ["puppy", "Cachorro"],
  ["adult", "Adulto"],
  ["senior", "Senior"],
] as const;

function durationLabel(result: FoodDurationResult) {
  const min = Math.round(result.durationDays.min);
  const max = Math.round(result.durationDays.max);
  return min === max ? `${min} días` : `${min}–${max} días`;
}

function gramsLabel(result: FoodDurationResult) {
  const min = Math.round(result.dailyGrams.min);
  const max = Math.round(result.dailyGrams.max);
  return min === max ? `${min} g/día` : `${min}–${max} g/día`;
}

export function LandingPlanQuiz({ products }: LandingPlanQuizProps) {
  const [step, setStep] = useState<QuizStep>(1);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<Species | "">("");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [lifeStage, setLifeStage] = useState("adult");
  const [productSlug, setProductSlug] = useState(products[0]?.slug ?? "");
  const [variantId, setVariantId] = useState(products[0]?.variants[0]?.id ?? "");
  const [result, setResult] = useState<FoodDurationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableProducts = useMemo(
    () => species ? products.filter((item) => !item.species || item.species === species) : products,
    [products, species],
  );
  const product = useMemo(
    () => availableProducts.find((item) => item.slug === productSlug) ?? availableProducts[0],
    [availableProducts, productSlug],
  );
  const variant = product?.variants.find((item) => item.id === variantId) ?? product?.variants[0];

  function chooseProduct(slug: string) {
    const next = products.find((item) => item.slug === slug);
    setProductSlug(slug);
    setVariantId(next?.variants[0]?.id ?? "");
    setResult(null);
    setError(null);
  }

  function chooseSpecies(nextSpecies: Species) {
    setSpecies(nextSpecies);
    const nextProduct = products.find((item) => !item.species || item.species === nextSpecies);
    setProductSlug(nextProduct?.slug ?? "");
    setVariantId(nextProduct?.variants[0]?.id ?? "");
    setResult(null);
    setError(null);
  }

  async function calculateDuration() {
    if (!product || !variant) return false;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          variantId: variant.id,
          petWeightKg: Number(weight.replace(",", ".")),
          lifeStage,
          attributes: { ...(species ? { species } : {}), ...(breed.trim() ? { breed: breed.trim() } : {}) },
        }),
      });
      const payload = await response.json() as FoodDurationResult | { message?: string };
      if (!response.ok) throw new Error("message" in payload ? payload.message : "No pudimos calcular la duración.");
      setResult(payload as FoodDurationResult);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos calcular la duración.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (step === 1) {
      const numericWeight = Number(weight.replace(",", "."));
      if (!petName.trim()) return setError("Contanos cómo se llama tu mascota.");
      if (!species) return setError("Elegí si es perro o gato.");
      if (!Number.isFinite(numericWeight) || numericWeight <= 0 || numericWeight > 120) {
        return setError("Ingresá un peso válido entre 0,1 y 120 kg.");
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!variant) return setError("Elegí una presentación para continuar.");
      const calculated = await calculateDuration();
      if (calculated) setStep(3);
      return;
    }

    if (!result) await calculateDuration();
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(1, current - 1) as QuizStep);
  }

  if (!products.length) {
    return (
      <div className="rounded-[1.5rem] bg-white p-6 text-ink sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-xl bg-soft-yellow text-ink">
          <Calculator size={24} weight="duotone" aria-hidden="true" />
        </div>
        <h3 className="mt-5 font-display text-2xl font-semibold">La calculadora está esperando al catálogo</h3>
        <p className="mt-2 max-w-md text-muted">Cuando haya alimentos activos con presentación y datos de duración, vas a poder calcular la próxima reposición.</p>
        <a href="/perros" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white">Ver catálogo <ArrowRight size={18} weight="bold" /></a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-[1.75rem] bg-white text-ink shadow-[0_24px_70px_rgba(0,26,78,0.18)]">
      <div className="border-b border-border px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">Plan de reposición</p>
            <p className="mt-1 font-display text-xl font-semibold sm:text-2xl">Para que no tengas que adivinar</p>
          </div>
          <span className="shrink-0 rounded-full bg-soft-blue px-3 py-1.5 text-xs font-bold text-brand-blue">{step} de 3</span>
        </div>
        <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Progreso del plan">
          {["Tu mascota", "Su alimento", "Su resultado"].map((label, index) => {
            const itemStep = index + 1;
            return <li key={label} className={`border-t-2 pt-2 text-xs font-semibold ${itemStep <= step ? "border-brand-blue text-ink" : "border-border text-muted"}`}>{label}</li>;
          })}
        </ol>
      </div>

      <div className="p-5 sm:p-8">
        {step === 1 ? (
          <div>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-yellow text-ink"><PawPrint size={22} weight="duotone" aria-hidden="true" /></span>
              <div><h2 className="font-display text-2xl font-semibold sm:text-3xl">Empecemos por quien más importa</h2><p className="mt-1 text-sm text-muted">Con unos pocos datos estimamos su ritmo de consumo.</p></div>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="font-semibold sm:col-span-2">¿Cómo se llama?<input value={petName} onChange={(event) => setPetName(event.target.value)} className="mt-2 h-13 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10" placeholder="Ej. Rocky" autoComplete="off" /></label>
              <fieldset className="sm:col-span-2"><legend className="font-semibold">¿Es perro o gato?</legend><div className="mt-2 grid grid-cols-2 gap-3">{([['dog', 'Perro', Dog], ['cat', 'Gato', Cat]] as const).map(([value, label, Icon]) => <label key={value} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 font-semibold transition-colors ${species === value ? "border-brand-blue bg-soft-blue" : "border-border bg-white hover:border-brand-blue/50"}`}><input type="radio" name="species" value={value} checked={species === value} onChange={() => chooseSpecies(value)} className="sr-only" /><Icon size={24} weight="duotone" className={species === value ? "text-brand-blue" : "text-muted"} aria-hidden="true" />{label}{species === value ? <Check size={17} weight="bold" className="ml-auto text-brand-blue" aria-hidden="true" /> : null}</label>)}</div></fieldset>
              <label className="font-semibold">Peso<input value={weight} onChange={(event) => setWeight(event.target.value)} className="mt-2 h-13 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10" inputMode="decimal" min="0.1" max="120" step="0.1" placeholder="Ej. 12 kg" /></label>
              <label className="font-semibold">Etapa<select value={lifeStage} onChange={(event) => setLifeStage(event.target.value)} className="mt-2 h-13 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10">{lifeStages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="font-semibold sm:col-span-2">Raza <span className="font-normal text-muted">(opcional)</span><input value={breed} onChange={(event) => setBreed(event.target.value)} className="mt-2 h-13 w-full rounded-xl border border-border px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10" placeholder="Ej. Mestizo, caniche, siamés…" autoComplete="off" /></label>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-blue text-brand-blue"><Package size={22} weight="duotone" aria-hidden="true" /></span><div><h2 className="font-display text-2xl font-semibold sm:text-3xl">¿Qué come {petName.trim() || "tu mascota"}?</h2><p className="mt-1 text-sm text-muted">Elegí el alimento y la presentación que ya conoce.</p></div></div>
            <label className="mt-7 block font-semibold">Alimento<select value={product?.slug ?? ""} onChange={(event) => chooseProduct(event.target.value)} className="mt-2 h-13 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10">{products.map((item) => <option key={item.id} value={item.slug}>{item.brand.name} · {item.name}</option>)}</select></label>
            <fieldset className="mt-6"><legend className="font-semibold">Presentación</legend><div className="mt-2 flex flex-wrap gap-2">{product?.variants.map((item) => <label key={item.id} className={`flex min-h-12 cursor-pointer items-center rounded-xl border px-4 text-sm font-semibold ${item.id === variant?.id ? "border-brand-yellow bg-brand-yellow" : "border-border bg-white hover:border-brand-blue/50"}`}><input type="radio" name="presentation" value={item.id} checked={item.id === variant?.id} onChange={() => { setVariantId(item.id); setResult(null); }} className="sr-only" />{item.presentation ?? formatWeight(item.weightGrams) ?? "Presentación"}</label>)}</div></fieldset>
            <p className="mt-6 flex items-start gap-2 rounded-xl bg-catalog-canvas p-4 text-sm leading-6 text-muted"><Info size={19} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />Usamos la información del fabricante cuando está disponible y marcamos cualquier estimación general.</p>
          </div>
        ) : null}

        {step === 3 ? (
          <div aria-live="polite">
            <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-ink"><Calculator size={22} weight="duotone" aria-hidden="true" /></span><div><p className="text-sm text-muted">La Patitas de {petName.trim() || "tu mascota"}</p><h2 className="font-display text-3xl font-semibold sm:text-4xl">Una próxima compra más simple.</h2></div></div>
            {result ? <div className="mt-7 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-soft-blue p-5"><p className="text-sm text-muted">Consumo estimado</p><p className="mt-2 font-display text-4xl font-semibold text-brand-blue">{gramsLabel(result)}</p></div><div className="rounded-2xl bg-soft-yellow p-5"><p className="text-sm text-muted">Esta presentación dura</p><p className="mt-2 font-display text-4xl font-semibold">≈ {durationLabel(result)}</p></div></div> : <div className="mt-7 rounded-2xl bg-catalog-canvas p-5"><p className="font-semibold">Tenemos los datos. Calculemos cuánto debería durar esta presentación.</p></div>}
            {result ? <div className="mt-4 rounded-2xl border border-border p-5"><div className="flex items-start gap-3"><Info size={20} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" /><div><p className="font-semibold">{result.sourceLabel}</p><p className="mt-1 text-sm leading-6 text-muted">{result.isFallback ? "Es una estimación general. La actividad, condición corporal y recomendación veterinaria también pueden influir." : "El cálculo usa la tabla cargada del fabricante."}</p></div></div>{result.assumptions.map((assumption) => <p key={assumption} className="mt-2 text-xs text-muted">{assumption}</p>)}</div> : null}
            {variant ? <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-ink p-5 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-white/65">Presentación elegida</p><p className="mt-1 font-display text-xl font-semibold">{product?.name} · {variant.presentation ?? formatWeight(variant.weightGrams) ?? "Presentación"}</p><p className="mt-1 text-sm text-white/70">{formatMoney(variant.salePrice)} · compra única</p></div><AddToCartButton variant={variant} /></div> : null}
          </div>
        ) : null}

        {error ? <p role="alert" className="mt-5 rounded-xl bg-[#fff1f1] p-4 text-sm font-semibold text-[#8d2020]">{error}</p> : null}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">{step > 1 ? <button type="button" onClick={goBack} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 font-semibold text-ink hover:border-brand-blue"><ArrowLeft size={18} />Volver</button> : <span />}{step < 3 ? <button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white hover:bg-[#0048dc] disabled:opacity-60">{loading ? "Calculando…" : step === 1 ? "Continuar" : "Ver mi resultado"}<ArrowRight size={18} weight="bold" /></button> : !result ? <button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white hover:bg-[#0048dc] disabled:opacity-60">{loading ? "Calculando…" : "Calcular duración"}<Calculator size={18} weight="bold" /></button> : <span className="hidden sm:block" />}</div>
      </div>
    </form>
  );
}
