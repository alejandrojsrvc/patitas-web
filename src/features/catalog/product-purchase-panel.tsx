"use client";

import { Calculator, Check, Info, MapPin, ShareNetwork, ShieldCheck, ShoppingCartSimple, Truck } from "@phosphor-icons/react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import type { Product, ProductVariant, ReplenishmentEstimate } from "@/domain/catalog/types";
import type { CustomerPet } from "@/domain/customer/types";
import { useCart } from "@/features/cart/cart-context";
import { deliveryBadgeCopy, formatMoney, pricePerKilogram } from "@/lib/catalog-formatters";
import { variantLabel } from "@/lib/catalog-variants";
import { productQuantityOptions, resolvedAvailableQuantity } from "@/lib/product-purchase";
import { productDisplayName } from "@/lib/product-seo";
import { usePetShopping } from "@/features/pets/pet-shopping-context";
import { petForProduct } from "@/lib/pet-shopping";

export function ProductInfoColumn({
  product,
  variant,
  onSelectedVariantChange,
}: {
  product: Product;
  variant: ProductVariant;
  onSelectedVariantChange: (variantId: string) => void;
}) {
  const displayName = productDisplayName(product);

  return (
    <section className="order-2 min-w-0" aria-labelledby="product-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <Link
          href={`/marcas/${product.brand.slug}`}
          className="min-w-0 pt-2 text-sm font-semibold text-muted hover:text-brand-blue hover:underline"
        >
          {product.brand.name}
        </Link>
        <ProductShareButton product={product} />
      </div>
      <h1 id="product-title" className="display-heading mt-2 text-3xl sm:text-4xl">
        {displayName}
      </h1>

      <fieldset className="mt-7">
        <legend className="mb-3 text-sm font-semibold">Elegí la presentación</legend>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((item) => (
            <label
              key={item.id}
              className={`flex w-auto ${item.fulfillment.purchasable ? "cursor-pointer" : "cursor-not-allowed"} flex-col justify-center rounded-xl border bg-catalog-canvas px-4 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-blue ${item.id === variant.id ? "border-[#7ea4df] bg-catalog-canvas shadow-[inset_0_0_0_1px_rgba(0,58,177,0.14)]" : "border-border hover:border-[#c3d2eb]"} ${item.fulfillment.purchasable ? "" : "opacity-60"}`}
            >
              <input
                type="radio"
                name="variant"
                value={item.id}
                checked={item.id === variant.id}
                onChange={() => onSelectedVariantChange(item.id)}
                disabled={!item.fulfillment.purchasable}
                className="sr-only"
              />
              <span className="font-semibold">{variantLabel(item)}</span>
              {!item.fulfillment.purchasable ? <span className="text-xs text-muted">Sin stock</span> : null}
            </label>
          ))}
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          Presentación seleccionada: {variantLabel(variant)}. {variant.fulfillment.purchasable ? "Disponible para comprar." : "Sin stock."}
        </p>
      </fieldset>
    </section>
  );
}

export function ProductDescription({ product }: { product: Product }) {
  const displayName = productDisplayName(product);

  return (
    <section className="order-4 mt-8 border-t border-catalog-line pt-7 sm:mt-10 sm:pt-8" aria-labelledby="about-product-title">
      <h2 id="about-product-title" className="font-display text-2xl font-semibold">
        Sobre el producto
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        {product.description ??
          `Conocé ${displayName}, sus presentaciones disponibles y la información necesaria para elegirlo para tu mascota.`}
      </p>
    </section>
  );
}

export function ProductBuyBox({
  product,
  variant,
  quantity,
  onQuantityChange,
}: {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  const { addItem, loading: cartBusy } = useCart();
  const { activePet } = usePetShopping();
  const purchasePet = petForProduct(product, activePet);
  const submitting = useRef(false);
  const [activeAction, setActiveAction] = useState<"cart" | "buy" | null>(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableQuantity = resolvedAvailableQuantity(variant);
  const quantityOptions = productQuantityOptions(availableQuantity);
  const purchasable = variant.fulfillment.purchasable && quantityOptions.length > 0;
  const delivery = deliveryCopy(variant);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timer);
  }, [added]);

  async function submit(action: "cart" | "buy") {
    if (submitting.current || cartBusy || !purchasable) return;
    submitting.current = true;
    let navigating = false;
    setActiveAction(action);
    setAdded(false);
    setError(null);
    try {
      await addItem(variant.id, quantity, purchasePet ? { role: "MAIN", petId: purchasePet.id, planId: null } : undefined);
      if (action === "buy") {
        navigating = true;
        // The cart BFF may set the anonymous cart token cookie; a full navigation
        // lets the server-side checkout initializer consume it deterministically.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/checkout/iniciar";
        return;
      }
      setAdded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos actualizar el carrito. Intentá nuevamente.");
    } finally {
      if (!navigating) {
        submitting.current = false;
        setActiveAction(null);
      }
    }
  }

  return (
    <aside className="h-fit rounded-2xl bg-white p-5 lg:sticky lg:top-24" aria-label={`Compra de ${product.name}`}>
      <div>
        <p className="text-sm font-semibold text-ink">{variantLabel(variant)}</p>
        <p className="font-display text-3xl font-semibold tabular-nums text-brand-blue">{formatMoney(variant.salePrice)}</p>
        {variant.compareAtPrice ? (
          <p className="mt-1 text-sm tabular-nums text-muted line-through">{formatMoney(variant.compareAtPrice)}</p>
        ) : null}
        {pricePerKilogram(variant) ? (
          <p className="mt-1 text-xs font-normal tabular-nums text-muted">{formatMoney(pricePerKilogram(variant) ?? 0)} por kg</p>
        ) : null}
      </div>

      {product.offers.length ? (
        <div className="mt-5 grid gap-2">
          {product.offers.map((offer) => (
            <div key={offer.id} className="rounded-xl bg-soft-yellow px-3 py-2.5 text-sm">
              <strong>{offer.name}</strong>
              <span className="ml-2 text-muted">{offer.type === "PERCENTAGE" ? `${offer.value}% de descuento` : offer.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 border-y border-catalog-line py-4">
        <div className="flex items-start gap-3">
          <Truck size={21} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${purchasable ? "text-ink" : "text-muted"}`}>
              {purchasable ? `${availableQuantity} ${availableQuantity === 1 ? "unidad disponible" : "unidades disponibles"}` : "Sin stock"}
            </p>
            {delivery ? (
              <>
                <p className="mt-1 text-sm">
                  <span className="font-semibold text-brand-blue">Entrega estimada: {delivery.deliveryLabel}</span>
                  {delivery.orderBefore ? <span className="text-muted"> · Pedilo antes de {delivery.orderBefore}</span> : null}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">Confirmá costo y horario con tu dirección en el checkout.</p>
              </>
            ) : (
              <p className="mt-1 text-sm leading-5 text-muted">
                {purchasable ? "Calculando la próxima ventana…" : "Esta presentación no está disponible para comprar."}
              </p>
            )}
          </div>
        </div>
      </div>

      <label className="mt-5 block text-sm font-semibold" htmlFor="product-quantity">
        Cantidad
        <select
          id="product-quantity"
          value={purchasable ? quantity : 0}
          onChange={(event) => onQuantityChange(Number(event.target.value))}
          disabled={!purchasable || activeAction !== null || cartBusy}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-3 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 disabled:cursor-not-allowed disabled:bg-catalog-soft disabled:text-muted"
        >
          {!purchasable ? (
            <option value={0}>No disponible</option>
          ) : (
            quantityOptions.map((option) => (
              <option key={option} value={option}>
                {option} {option === 1 ? "unidad" : "unidades"}
              </option>
            ))
          )}
        </select>
      </label>

      <div className="mt-4 grid gap-2.5">
        <button
          type="button"
          onClick={() => void submit("buy")}
          disabled={!purchasable || activeAction !== null || cartBusy}
          aria-busy={activeAction === "buy" || cartBusy}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-4 font-semibold text-white transition-colors hover:bg-[#0048dc] disabled:cursor-not-allowed disabled:bg-[#a8b9dc]"
        >
          {activeAction === "buy" ? "Preparando compra…" : "Comprar ahora"}
        </button>
        <button
          type="button"
          onClick={() => void submit("cart")}
          disabled={!purchasable || activeAction !== null || cartBusy}
          aria-busy={activeAction === "cart" || cartBusy}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-soft-blue px-4 font-semibold text-brand-blue transition-colors hover:bg-[#dbe8ff] disabled:cursor-not-allowed disabled:bg-catalog-soft disabled:text-muted"
        >
          {added ? <Check size={19} weight="bold" aria-hidden="true" /> : <ShoppingCartSimple size={19} weight="bold" aria-hidden="true" />}
          {activeAction === "cart" ? "Agregando…" : added ? "Agregado al carrito" : "Agregar al carrito"}
        </button>
        {added ? (
          <Link
            href="/carrito"
            prefetch={false}
            className="inline-flex min-h-11 items-center justify-center font-semibold text-brand-blue hover:underline"
          >
            Ver carrito
          </Link>
        ) : null}
      </div>

      <ul className="mt-5 grid gap-2 border-t border-catalog-line pt-4 text-xs text-muted">
        <li className="flex items-start gap-2">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
          <span>El pago se completa de forma segura en el checkout.</span>
        </li>
        <li className="flex items-start gap-2">
          <MapPin size={17} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
          <span>La entrega se confirma con tu dirección antes de finalizar.</span>
        </li>
      </ul>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-[#fff1f1] p-3 text-sm text-[#8d2020]">
          {error}
        </p>
      ) : null}
    </aside>
  );
}

function ProductShareButton({ product }: { product: Product }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const displayName = productDisplayName(product);

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2400);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copyProductLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  async function shareProduct() {
    const url = new URL(`/producto/${product.slug}`, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: `Mirá ${displayName} en Patitas Inquietas.`,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyProductLink(url);
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => void shareProduct()}
        className="touch-target inline-flex items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-ink transition-colors hover:border-brand-blue hover:text-brand-blue"
        aria-describedby="product-share-status"
      >
        <ShareNetwork size={18} weight="bold" aria-hidden="true" />
        <span className="hidden sm:inline">Compartir</span>
      </button>
      <span
        id="product-share-status"
        aria-live="polite"
        className={`mt-2 block w-max max-w-52 break-words rounded-lg px-3 py-2 text-left text-xs font-semibold ${status === "copied" ? "bg-ink text-white" : status === "error" ? "bg-[#8d2020] text-white" : "sr-only"}`}
      >
        {status === "copied"
          ? "Enlace copiado"
          : status === "error"
            ? "No pudimos compartirlo. Intentá nuevamente o copialo desde el navegador."
            : ""}
      </span>
    </div>
  );
}

export function ProductDurationCalculator({ product, variant }: { product: Product; variant: ProductVariant }) {
  const { activePet } = usePetShopping();

  return (
    <ProductDurationCalculatorForm
      key={`${product.id}:${variant.id}:${activePet?.id ?? "general"}:${activePet?.updatedAt ?? ""}`}
      product={product}
      variant={variant}
      activePet={activePet}
    />
  );
}

function ProductDurationCalculatorForm({
  product,
  variant,
  activePet,
}: {
  product: Product;
  variant: ProductVariant;
  activePet: CustomerPet | null;
}) {
  const [result, setResult] = useState<ReplenishmentEstimate | null>(null);
  const [submittedDetails, setSubmittedDetails] = useState<{ weight: string; lifeStage: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestController = useRef<AbortController | null>(null);
  const lifeStageOptions = getLifeStageOptions(product.species);
  const productLifeStage = calculatorLifeStage(product.lifeStage, product.species);
  const defaultLifeStage = lifeStageOptions.some((option) => option.value === productLifeStage)
    ? productLifeStage!
    : lifeStageOptions[0].value;
  const [weight, setWeight] = useState(activePet?.weightKg ?? "");
  const [lifeStage, setLifeStage] = useState(() => petLifeStageForCalculator(activePet, product, defaultLifeStage));

  useEffect(() => () => requestController.current?.abort(), []);

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedWeight = weight.trim();
    const numericWeight = Number(normalizedWeight);
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      setError("Ingresá un peso válido en kilos, por ejemplo 12.");
      return;
    }
    const species = product.species?.toLowerCase() ?? activePet?.species;
    if (!species) {
      setError("No pudimos identificar si el alimento es para perro o gato.");
      return;
    }
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);
    setSubmittedDetails({ weight: normalizedWeight, lifeStage });
    try {
      const response = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id,
          petWeightKg: numericWeight,
          species,
          lifeStage,
        }),
      });
      const payload = (await response.json()) as ReplenishmentEstimate | { message: string };
      if (!response.ok) throw new Error("message" in payload ? payload.message : "No pudimos hacer el cálculo.");
      setResult(payload as ReplenishmentEstimate);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "No pudimos calcular esta presentación. Revisá el peso e intentá nuevamente.");
    } finally {
      if (requestController.current === controller) {
        setLoading(false);
        requestController.current = null;
      }
    }
  }

  const durationCopy = result
    ? result.durationDays.min === result.durationDays.max
      ? `${Math.round(result.durationDays.min)} días`
      : `${Math.round(result.durationDays.min)} a ${Math.round(result.durationDays.max)} días`
    : null;

  return (
    <form
      id="duracion"
      onSubmit={calculate}
      className="mt-10 scroll-mt-28 rounded-2xl bg-white p-5 sm:p-7 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10"
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-yellow text-ink">
            <Calculator size={21} weight="duotone" aria-hidden="true" />
          </span>
          <h2 className="font-display text-2xl font-semibold">¿Cuánto le duraría?</h2>
        </div>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted">
          {activePet
            ? `Usamos los datos guardados de ${activePet.name} para estimar esta presentación.`
            : "Calculá una referencia para la presentación elegida según el peso y la etapa de tu mascota."}
        </p>
      </div>
      <div className="mt-6 lg:mt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold" htmlFor="duration-weight">
            {activePet ? `Peso de ${activePet.name}` : "Peso de tu mascota"} <span className="font-normal text-muted">(kg)</span>
            <input
              id="duration-weight"
              type="number"
              name="weight"
              inputMode="decimal"
              required
              min="0.1"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="12"
              aria-describedby="duration-weight-help"
              className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
            <span id="duration-weight-help" className="mt-1 block text-xs font-normal text-muted">
              Ingresá solo el número, por ejemplo 12.
            </span>
          </label>
          <label className="text-sm font-semibold" htmlFor="duration-life-stage">
            Etapa de vida
            <select
              id="duration-life-stage"
              name="lifeStage"
              value={lifeStage}
              onChange={(event) => setLifeStage(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            >
              {lifeStageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="mt-4 min-h-12 rounded-xl bg-ink px-5 font-semibold text-white hover:bg-brand-blue disabled:opacity-60"
        >
          {loading ? "Calculando…" : "Calcular duración"}
        </button>
        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-[#fff1f1] p-4 text-sm text-[#9b2c2c]">
            {error}
          </p>
        ) : null}
        {result ? (
          <div className="mt-5 rounded-xl bg-soft-blue p-5" aria-live="polite">
            <p className="text-sm text-muted">Duración estimada</p>
            <p className="mt-1 font-display text-4xl font-semibold text-brand-blue">{durationCopy}</p>
            {submittedDetails ? (
              <p className="mt-2 text-sm font-semibold text-ink">
                {submittedDetails.weight} kg · {lifeStageCopy(submittedDetails.lifeStage)} · {variantLabel(variant)}
              </p>
            ) : null}
            <p className="mt-3 flex items-start gap-2 text-sm text-muted">
              <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              {result.sourceLabel}
            </p>
            {result.assumptions.map((assumption) => (
              <p key={assumption} className="mt-2 text-xs text-muted">
                {assumption}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </form>
  );
}

function getLifeStageOptions(species: Product["species"]) {
  const commonOptions = [
    { value: "adult", label: "Adulto" },
    { value: "senior", label: "Senior" },
  ];
  if (species === "DOG") return [{ value: "puppy", label: "Cachorro" }, ...commonOptions];
  if (species === "CAT") return [{ value: "kitten", label: "Gatito" }, ...commonOptions];
  return [{ value: "puppy", label: "Cachorro" }, { value: "kitten", label: "Gatito" }, ...commonOptions];
}

function lifeStageCopy(value: string) {
  return ({ puppy: "Cachorro", kitten: "Gatito", adult: "Adulto", senior: "Senior" } as Record<string, string>)[value] ?? value;
}

function calculatorLifeStage(stage: Product["lifeStage"], species: Product["species"]) {
  if (stage === "PUPPY") return species === "CAT" ? "kitten" : "puppy";
  return stage?.toLowerCase();
}

function petLifeStageForCalculator(activePet: CustomerPet | null, product: Product, fallback: string) {
  if (!activePet) return fallback;
  const stage = activePet.species === "cat" && activePet.lifeStage === "puppy" ? "kitten" : activePet.lifeStage;
  return getLifeStageOptions(product.species).some((option) => option.value === stage) ? stage : fallback;
}

function deliveryCopy(variant: ProductVariant) {
  if (!variant.fulfillment.purchasable || variant.fulfillment.availableQuantity <= 0) return null;
  return { deliveryLabel: deliveryBadgeCopy(variant), orderBefore: variant.fulfillment.orderBefore };
}
