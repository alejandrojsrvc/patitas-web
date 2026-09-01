"use client";

import { Calculator, Check, Info, MapPin, ShareNetwork, ShieldCheck, ShoppingCartSimple, Truck } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import type { FoodDurationResult, Product, ProductVariant } from "@/domain/catalog/types";
import { useCart } from "@/features/cart/cart-context";
import { deliveryBadgeCopy, formatMoney, pricePerKilogram } from "@/lib/catalog-formatters";
import { variantLabel } from "@/lib/catalog-variants";
import { productQuantityOptions, resolvedAvailableQuantity } from "@/lib/product-purchase";
import { productDisplayName } from "@/lib/product-seo";

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
    <section aria-labelledby="product-title">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/marcas/${product.brand.slug}`}
          className="pt-2 text-sm font-semibold text-muted hover:text-brand-blue hover:underline"
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
              className={`flex  w-auto cursor-pointer flex-col justify-center rounded-xl border bg-catalog-canvas px-4 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-blue ${item.id === variant.id ? "border-[#7ea4df] bg-catalog-canvas shadow-[inset_0_0_0_1px_rgba(0,58,177,0.14)]" : "border-border hover:border-[#c3d2eb]"} ${item.fulfillment.purchasable ? "" : "opacity-60"}`}
            >
              <input
                type="radio"
                name="variant"
                value={item.id}
                checked={item.id === variant.id}
                onChange={() => onSelectedVariantChange(item.id)}
                className="sr-only"
              />
              <span className="font-semibold">{variantLabel(item)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className="mt-7 border-t border-catalog-line pt-6" aria-labelledby="about-product-title">
        <h2 id="about-product-title" className="font-display text-2xl font-semibold">
          Sobre el producto
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {product.description ??
            `Conocé ${displayName}, sus presentaciones disponibles y la información necesaria para elegirlo para tu mascota.`}
        </p>
      </section>
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
  const router = useRouter();
  const { addItem } = useCart();
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
    setActiveAction(action);
    setAdded(false);
    setError(null);
    try {
      await addItem(variant.id, quantity);
      if (action === "buy") {
        router.push("/checkout/iniciar");
        return;
      }
      setAdded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos actualizar el carrito. Intentá nuevamente.");
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <aside className="h-fit rounded-2xl bg-white p-5 xl:sticky xl:top-24" aria-label={`Compra de ${product.name}`}>
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
                  <span className="font-semibold text-brand-blue">{delivery.deliveryLabel}</span>
                  {delivery.orderBefore ? <span className="text-muted"> · Pedilo antes de {delivery.orderBefore}</span> : null}
                </p>
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
          disabled={!purchasable || activeAction !== null}
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
          disabled={!purchasable || activeAction !== null}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-4 font-semibold text-white transition-colors hover:bg-[#0048dc] disabled:cursor-not-allowed disabled:bg-[#a8b9dc]"
        >
          {activeAction === "buy" ? "Preparando compra…" : "Comprar ahora"}
        </button>
        <button
          type="button"
          onClick={() => void submit("cart")}
          disabled={!purchasable || activeAction !== null}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-soft-blue px-4 font-semibold text-brand-blue transition-colors hover:bg-[#dbe8ff] disabled:cursor-not-allowed disabled:bg-catalog-soft disabled:text-muted"
        >
          {added ? <Check size={19} weight="bold" aria-hidden="true" /> : <ShoppingCartSimple size={19} weight="bold" aria-hidden="true" />}
          {activeAction === "cart" ? "Agregando…" : added ? "Agregado al carrito" : "Agregar al carrito"}
        </button>
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
    <div className="relative shrink-0">
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
        className={`absolute right-0 top-full z-10 mt-2 w-max max-w-52 rounded-lg px-3 py-2 text-xs font-semibold ${status === "copied" ? "bg-ink text-white" : status === "error" ? "bg-[#8d2020] text-white" : "sr-only"}`}
      >
        {status === "copied" ? "Enlace copiado" : status === "error" ? "No pudimos copiar el enlace" : ""}
      </span>
    </div>
  );
}

export function ProductDurationCalculator({ product, variant }: { product: Product; variant: ProductVariant }) {
  const [result, setResult] = useState<FoodDurationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          variantId: variant.id,
          petWeightKg: Number(data.get("weight")),
          lifeStage: data.get("lifeStage"),
        }),
      });
      const payload = (await response.json()) as FoodDurationResult | { message: string };
      if (!response.ok) throw new Error("message" in payload ? payload.message : "No pudimos hacer el cálculo.");
      setResult(payload as FoodDurationResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos hacer el cálculo.");
    } finally {
      setLoading(false);
    }
  }

  const durationCopy = result
    ? result.durationDays.min === result.durationDays.max
      ? `${Math.round(result.durationDays.min)} días`
      : `${Math.round(result.durationDays.min)} a ${Math.round(result.durationDays.max)} días`
    : null;

  return (
    <form
      onSubmit={calculate}
      className="mt-10 rounded-2xl bg-white p-5 sm:p-7 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10"
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-yellow text-ink">
            <Calculator size={21} weight="duotone" aria-hidden="true" />
          </span>
          <h2 className="font-display text-2xl font-semibold">¿Cuánto le duraría?</h2>
        </div>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted">
          Calculá una referencia para la presentación elegida según el peso y la etapa de tu mascota.
        </p>
      </div>
      <div className="mt-6 lg:mt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Peso de tu mascota
            <input
              name="weight"
              inputMode="decimal"
              required
              min="0.1"
              step="0.1"
              placeholder="Ej. 12 kg"
              className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </label>
          <label className="text-sm font-semibold">
            Etapa
            <select
              name="lifeStage"
              defaultValue={product.lifeStage ?? "adult"}
              className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="puppy">Cachorro</option>
              <option value="kitten">Gatito</option>
              <option value="adult">Adulto</option>
              <option value="senior">Senior</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
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
            <p className="mt-3 flex items-start gap-2 text-sm text-muted">
              <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              {result.sourceLabel}
              {result.isFallback ? " · Estimación general" : " · Tabla del fabricante"}
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

function deliveryCopy(variant: ProductVariant) {
  if (!variant.fulfillment.purchasable || variant.fulfillment.availableQuantity <= 0) return null;
  return { deliveryLabel: deliveryBadgeCopy(variant), orderBefore: variant.fulfillment.orderBefore };
}
