"use client";

import { Calculator, Info } from "@phosphor-icons/react";
import { useMemo, useState, type FormEvent } from "react";
import type { CalculatorProductProjection, ReplenishmentEstimate } from "@/domain/catalog/types";
import { formatWeight } from "@/lib/catalog-formatters";

const consentVersion = "2026-08-26";

export function FoodCalculator({ products }: { products: CalculatorProductProjection[] }) {
  const [productSlug, setProductSlug] = useState(products[0]?.slug ?? "");
  const product = useMemo(() => products.find((item) => item.slug === productSlug) ?? products[0], [productSlug, products]);
  const [variantId, setVariantId] = useState(product?.variants[0]?.id ?? "");
  const [weight, setWeight] = useState("");
  const [lifeStage, setLifeStage] = useState(product?.lifeStage?.toLowerCase() ?? "adult");
  const [result, setResult] = useState<ReplenishmentEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [leadStatus, setLeadStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [leadError, setLeadError] = useState<string | null>(null);

  function selectProduct(slug: string) {
    const next = products.find((item) => item.slug === slug);
    setProductSlug(slug);
    setVariantId(next?.variants[0]?.id ?? "");
    setLifeStage(next?.lifeStage?.toLowerCase() ?? "adult");
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
        body: JSON.stringify({
          productId: product.id,
          variantId,
          petWeightKg: Number(weight.replace(",", ".")),
          species: product.species?.toLowerCase() ?? "dog",
          lifeStage,
        }),
      });
      const payload = (await response.json()) as ReplenishmentEstimate | { message: string };
      if (!response.ok) throw new Error("message" in payload ? payload.message : "No pudimos calcular la duración.");
      setResult(payload as ReplenishmentEstimate);
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
          estimateId: result.id,
          email: email.trim(),
          consent: emailConsent,
          consentVersion,
          token: result.accessToken,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "No pudimos guardar tu aviso de reposición.");
      setLeadStatus("success");
    } catch (cause) {
      setLeadStatus("error");
      setLeadError(cause instanceof Error ? cause.message : "No pudimos guardar tu aviso de reposición.");
    }
  }

  if (!products.length)
    return (
      <div className="rounded-2xl bg-soft-yellow p-6">
        <h2 className="font-display text-2xl font-semibold">La calculadora espera el catálogo</h2>
        <p className="mt-2 text-muted">
          Para calcular necesitamos al menos un alimento activo con presentación, precio y factor general configurado en Patitas API.
        </p>
      </div>
    );

  const fieldClass =
    "mt-2 h-12 w-full rounded-xl border border-catalog-line bg-white px-4 font-normal text-ink outline-none transition-colors focus:border-brand-blue";

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <div className="border-b border-catalog-line bg-store-navy px-5 py-5 text-white sm:px-7">
        <h2 className="font-display text-2xl font-semibold">Datos para el cálculo</h2>
        <p className="mt-1 text-sm text-white/70">Completá los cuatro campos. No necesitás crear una cuenta.</p>
      </div>
      <form onSubmit={submit} className="p-5 sm:p-7">
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Alimento
              <select value={product?.slug} onChange={(event) => selectProduct(event.target.value)} className={fieldClass}>
                {products.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Presentación
              <select
                value={variantId}
                onChange={(event) => {
                  setVariantId(event.target.value);
                  setResult(null);
                  setLeadStatus("idle");
                }}
                className={fieldClass}
              >
                {product?.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.presentation ?? formatWeight(variant.weightGrams) ?? "Presentación"}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Peso de tu mascota <span className="font-normal text-muted">(kg)</span>
              <input
                name="weight"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                required
                min="0.1"
                step="0.1"
                inputMode="decimal"
                placeholder="Ej. 12"
                className={fieldClass}
              />
            </label>
            <label className="text-sm font-semibold">
              Etapa
              <select name="lifeStage" value={lifeStage} onChange={(event) => setLifeStage(event.target.value)} className={fieldClass}>
                <option value="puppy">Cachorro</option>
                <option value="kitten">Gatito</option>
                <option value="adult">Adulto</option>
                <option value="senior">Senior</option>
              </select>
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !variantId}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white hover:bg-[#0048dc] disabled:opacity-60"
        >
          <Calculator size={20} weight="bold" />
          {loading ? "Calculando…" : "Calcular duración"}
        </button>
        {error ? (
          <p role="alert" className="mt-5 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#8d2020]">
            {error}
          </p>
        ) : null}
      </form>
      {result ? (
        <section className="border-t border-catalog-line bg-catalog-soft p-5 sm:p-7" aria-live="polite">
          <div className="grid gap-5 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
            <div>
              <p className="text-sm font-semibold text-muted">Duración estimada</p>
              <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-brand-blue sm:text-5xl">
                ≈{" "}
                {result.durationDays.min === result.durationDays.max
                  ? Math.round(result.durationDays.min)
                  : `${Math.round(result.durationDays.min)}–${Math.round(result.durationDays.max)}`}{" "}
                días
              </p>
            </div>
            <div
              className={`flex items-start gap-3 rounded-xl p-4 ${result.source === "GENERAL_FALLBACK" ? "bg-soft-yellow" : "bg-soft-blue"}`}
            >
              <Info size={21} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{result.sourceLabel}</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {result.source === "GENERAL_FALLBACK"
                    ? "No encontramos una tabla aplicable del fabricante. Usamos una estimación general y la marcamos como tal."
                    : "Calculado con la tabla cargada del fabricante."}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-catalog-line pt-6">
            <h2 className="font-display text-2xl font-semibold">Recibí un aviso antes de reponer</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Guardamos este cálculo para avisarte antes de que la presentación pueda terminarse. No genera una compra automática.
            </p>
            <form onSubmit={captureLead} className="mt-5 grid gap-4">
              <label className="text-sm font-semibold">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className={fieldClass}
                />
              </label>
              <label className="flex items-start gap-2 text-xs leading-5 text-muted">
                <input
                  type="checkbox"
                  required
                  checked={emailConsent}
                  onChange={(event) => setEmailConsent(event.target.checked)}
                  className="mt-1 size-4 accent-brand-blue"
                />
                Quiero recibir el aviso de reposición por email.
              </label>
              <button
                type="submit"
                disabled={leadStatus === "submitting" || leadStatus === "success"}
                className="min-h-12 rounded-xl bg-store-navy px-5 font-semibold text-white hover:bg-[#22364b] disabled:opacity-60"
              >
                {leadStatus === "submitting"
                  ? "Guardando aviso…"
                  : leadStatus === "success"
                    ? "Aviso solicitado"
                    : "Avisarme cuándo reponer"}
              </button>
              {leadStatus === "success" ? (
                <p role="status" className="text-sm text-[#17643a]">
                  Listo. Te avisaremos con la información de reposición disponible.
                </p>
              ) : null}
              {leadError ? (
                <p role="alert" className="text-sm text-[#8d2020]">
                  {leadError}
                </p>
              ) : null}
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
