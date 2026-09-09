"use client";

import { Check, ShoppingCartSimple, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Product, ProductVariant } from "@/domain/catalog/types";
import { formatMoney } from "@/lib/catalog-formatters";
import { variantLabel } from "@/lib/catalog-variants";
import { useSessionShell } from "@/features/session/session-shell-context";
import { useCart } from "./cart-context";
import { usePetShopping } from "@/features/pets/pet-shopping-context";
import { petForProduct } from "@/lib/pet-shopping";

type ShippingQuote = {
  available: boolean;
  freeShippingFrom?: string | null;
  eligibleAmount?: string;
  remainingForFreeShipping?: string | null;
  message?: string;
};

export function AddToCartButton({
  variant,
  compact = false,
  quantity = 1,
  productName,
  product,
}: {
  variant: ProductVariant;
  compact?: boolean;
  quantity?: number;
  productName?: string;
  product?: Product;
}) {
  const { addItem, subtotal, count } = useCart();
  const { activePet } = usePetShopping();
  const purchasePet = petForProduct(product, activePet);
  const sessionShell = useSessionShell();
  const location = sessionShell?.shell?.location ?? null;
  const hasLocation = Boolean(location && (location.postalCode || location.neighborhood || location.city));
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
  const requestedQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
  const submitting = useRef(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const closeModalRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasCartModalOpen = useRef(false);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const modalTitleId = useId();
  const disabled = !variant.fulfillment.purchasable;

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2500);
    return () => window.clearTimeout(timer);
  }, [added]);

  useEffect(() => {
    if (!showCartModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeModalRef.current?.focus({ preventScroll: true });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCartModal(false);
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showCartModal]);

  useEffect(() => {
    if (!showCartModal || !hasLocation || !location) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ subtotal: safeSubtotal.toFixed(2) });
    if (location.postalCode) params.set("postalCode", location.postalCode);
    if (location.neighborhood) params.set("neighborhood", location.neighborhood);
    if (location.city) params.set("city", location.city);
    if (location.province) params.set("province", location.province);
    fetch(`/api/commerce/shipping/quote?${params.toString()}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("shipping-quote-failed");
        return (await response.json()) as ShippingQuote;
      })
      .then((quote) => setShippingQuote(quote))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setShippingQuote(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setShippingQuoteLoading(false);
      });
    return () => controller.abort();
  }, [hasLocation, location, safeSubtotal, showCartModal]);

  useEffect(() => {
    if (showCartModal) {
      wasCartModalOpen.current = true;
      return;
    }
    if (!wasCartModalOpen.current) return;
    wasCartModalOpen.current = false;
    addButtonRef.current?.focus({ preventScroll: true });
  }, [showCartModal]);

  function openCartModal() {
    setShippingQuote(null);
    setShippingQuoteLoading(hasLocation);
    setShowCartModal(true);
  }

  async function add() {
    if (submitting.current || disabled || loading) return;
    submitting.current = true;
    setLoading(true);
    setAdded(false);
    setError(null);
    try {
      await addItem(variant.id, requestedQuantity, purchasePet ? { role: "MAIN", petId: purchasePet.id, planId: null } : undefined);
      setAdded(true);
      openCartModal();
    } catch (cause) {
      setError(readableAddToCartError(cause));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        ref={addButtonRef}
        disabled={disabled || loading}
        aria-busy={loading}
        onClick={add}
        className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium leading-5 whitespace-nowrap transition-colors disabled:cursor-not-allowed ${compact ? "min-h-11 w-full bg-brand-blue px-3 text-sm text-white hover:bg-[#0048dc] disabled:bg-[#a8b9dc]" : "min-h-14 w-full bg-brand-blue px-8 text-base text-white hover:bg-[#0048dc] disabled:bg-[#a8b9dc]"}`}
      >
        {!compact ? (
          added ? (
            <Check size={18} weight="bold" aria-hidden="true" />
          ) : (
            <ShoppingCartSimple size={18} weight="bold" aria-hidden="true" />
          )
        ) : null}
        {disabled
          ? "Sin stock"
          : loading
            ? "Agregando…"
            : added
              ? "Agregado al carrito"
              : error
                ? "Reintentar agregar"
                : compact
                  ? "Agregar al carrito"
                  : "Agregar al carrito"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-[#8d2020]">
          {error}
        </p>
      ) : null}
      <span className="sr-only" role="status">
        {added ? "Producto agregado al carrito" : ""}
      </span>
      {showCartModal ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCartModal(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(23,23,23,0.2)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={modalTitleId} className="font-display text-2xl font-semibold tracking-[-0.025em] text-ink">
                  Agregado al carrito
                </h2>
              </div>
              <button
                ref={closeModalRef}
                type="button"
                onClick={() => setShowCartModal(false)}
                aria-label="Cerrar confirmación"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-soft-blue hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue"
              >
                <X size={20} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-catalog-line p-3">
              <div className="min-w-0">
                <p className="line-clamp-2 break-words font-semibold text-ink" title={productName ?? "Producto"}>
                  {productName ?? "Producto"}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {variantLabel(variant)} · {requestedQuantity} {requestedQuantity === 1 ? "unidad" : "unidades"}
                </p>
                {purchasePet ? <p className="mt-1 text-sm font-semibold text-brand-blue">Para {purchasePet.name}</p> : null}
              </div>
              <span className="shrink-0 text-sm font-semibold text-brand-blue">Agregado</span>
            </div>
            <p className="mt-3 text-sm text-muted">
              Tenés {count} {count === 1 ? "producto" : "productos"} en total.
            </p>
            <div className="mt-5 rounded-xl bg-soft-blue p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Subtotal</span>
                <strong className="font-display text-xl tabular-nums text-ink">{formatMoney(safeSubtotal)}</strong>
              </div>
              <ShippingProgress quote={shippingQuote} loading={shippingQuoteLoading} hasLocation={hasLocation} />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Link
                href="/carrito"
                prefetch={false}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-[#0048dc]"
              >
                Ir al carrito
              </Link>
              <button
                type="button"
                onClick={() => setShowCartModal(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-catalog-line px-4 text-sm font-semibold text-ink hover:bg-catalog-soft"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ShippingProgress({ quote, loading, hasLocation }: { quote: ShippingQuote | null; loading: boolean; hasLocation: boolean }) {
  if (loading) {
    return (
      <p className="mt-2 text-sm text-muted" role="status">
        Calculando tu beneficio de envío…
      </p>
    );
  }
  if (!hasLocation) {
    return <p className="mt-2 text-sm text-muted">Elegí tu dirección en el checkout para calcular el envío gratis.</p>;
  }
  const threshold = Number(quote?.freeShippingFrom);
  const eligibleAmount = Number(quote?.eligibleAmount);
  if (!quote?.available || !Number.isFinite(threshold) || threshold <= 0 || !Number.isFinite(eligibleAmount)) {
    return <p className="mt-2 text-sm text-muted">El envío y la cobertura se confirman al elegir tu dirección.</p>;
  }
  const reportedRemaining = Number(quote.remainingForFreeShipping);
  const remaining = Number.isFinite(reportedRemaining) ? Math.max(0, reportedRemaining) : Math.max(0, threshold - eligibleAmount);
  const progress = Math.max(0, Math.min(100, Math.round((eligibleAmount / threshold) * 100)));
  if (remaining === 0) {
    return (
      <div className="mt-4" role="status">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold">
          <span>Envío gratis alcanzado</span>
          <span className="text-brand-blue">{progress}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-white"
          role="progressbar"
          aria-label="Progreso para envío gratis"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span className="block h-full rounded-full bg-brand-blue" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  }
  return (
    <div className="mt-4">
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="font-semibold">Envío gratis</span>
        <span className="shrink-0 font-semibold text-brand-blue">{progress}%</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-label="Progreso para envío gratis"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span className="block h-full rounded-full bg-brand-blue" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">Te faltan {formatMoney(remaining)} en productos elegibles.</p>
    </div>
  );
}

function readableAddToCartError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "";

  if (/failed to fetch|network|networkerror|conect/i.test(message)) {
    return "No pudimos conectarnos. Revisá tu conexión y volvé a intentar.";
  }
  if (/stock|disponib|cantidad|quantity/i.test(message)) {
    return "La disponibilidad cambió. Elegí otra presentación o volvé a intentar.";
  }
  if (/401|unauthorized|sesión|session/i.test(message)) {
    return "Tu sesión venció. Actualizá la página y volvé a intentar.";
  }
  if (/403|forbidden|permiso|permission/i.test(message)) {
    return "No pudimos completar esta acción. Actualizá la página y volvé a intentar.";
  }
  if (/404|not found|no encontramos/i.test(message)) {
    return "Este producto ya no está disponible. Revisá el detalle para ver otras opciones.";
  }
  if (/429|too many|rate limit/i.test(message)) {
    return "Estamos recibiendo muchas solicitudes. Esperá un momento y volvé a intentar.";
  }
  if (/5\d\d|server|servidor|internal/i.test(message)) {
    return "Tuvimos un problema momentáneo. Esperá un momento y volvé a intentar.";
  }
  return "No pudimos agregar el producto ahora. Revisá la disponibilidad e intentá nuevamente.";
}
