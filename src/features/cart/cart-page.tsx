"use client";

import { ArrowRight, Minus, Plus, Trash, Truck, WarningCircle } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { ProductImage } from "@/components/catalog/product-image";
import { formatMoney } from "@/lib/catalog-formatters";
import { useCart } from "./cart-context";
import { usePetShopping } from "@/features/pets/pet-shopping-context";

export function CartPageContent({ checkoutMessage, recommendations }: { checkoutMessage?: string; recommendations?: ReactNode }) {
  const { cart, items, subtotal, addItem, updateQuantity, removeItem, refresh, loading, error } = useCart();
  const { pets } = usePetShopping();
  const router = useRouter();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const changingRef = useRef(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [changing, setChanging] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<{
    variantId: string;
    quantity: number;
    productName: string;
    role: "MAIN" | "EXTRA";
    petId: string | null;
    planId: string | null;
  } | null>(null);
  const stockNeedsReview = items.some((item) => item.quantity > item.availableQuantity);
  const checkoutBlocked = changing || loading || stockNeedsReview;
  const goToCheckout = () => router.push("/checkout/iniciar");
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);
  async function changeCart(operation: () => Promise<void>) {
    if (changingRef.current || loading) return;
    changingRef.current = true;
    setChanging(true);
    setMutationError(null);
    try {
      await operation();
    } catch (cause) {
      setMutationError(
        readableCartError(cause instanceof Error ? cause.message : null, "No pudimos actualizar el carrito. Intentá nuevamente."),
      );
    } finally {
      changingRef.current = false;
      setChanging(false);
    }
  }

  async function removeCartItem(item: (typeof items)[number]) {
    await changeCart(async () => {
      await removeItem(item.id);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoItem({
        variantId: item.variantId,
        quantity: item.quantity,
        productName: item.productName,
        role: item.role,
        petId: item.petId,
        planId: item.planId,
      });
      undoTimerRef.current = setTimeout(() => setUndoItem(null), 8000);
    });
  }

  async function undoRemove() {
    if (!undoItem) return;
    const itemToRestore = undoItem;
    setUndoItem(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    await changeCart(() =>
      addItem(itemToRestore.variantId, itemToRestore.quantity, {
        role: itemToRestore.role,
        petId: itemToRestore.petId,
        planId: itemToRestore.planId,
      }),
    );
  }

  if (!cart && !error)
    return (
      <section role="status" className="rounded-xl bg-white p-8 text-center text-muted">
        Cargando tu carrito…
      </section>
    );

  if (error && !cart) {
    return (
      <section className="rounded-xl bg-white px-6 py-12 text-center sm:px-12 sm:py-16" role="alert">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#fff1f1] text-[#8d2020]">
          <WarningCircle size={28} weight="duotone" aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.025em]">No pudimos cargar tu carrito</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">{readableCartError(error, "No pudimos cargar tu carrito. Intentá nuevamente.")}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => void refresh()}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-5 font-semibold text-white hover:bg-[#0048dc] disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? "Intentando…" : "Reintentar"}
          </button>
          <Link
            href="/mi-cuenta"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-catalog-canvas px-5 font-semibold text-ink hover:text-brand-blue"
          >
            Revisar sesión
          </Link>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <div>
        <section className="rounded-xl bg-white px-6 py-12 text-center sm:px-12 sm:py-16">
          {error || checkoutMessage ? (
            <p role="alert" className="mx-auto mb-6 max-w-md rounded-lg bg-[#fff8e5] p-3 text-sm text-[#765400]">
              {checkoutMessage ?? readableCartError(error, "No pudimos actualizar el carrito. Intentá nuevamente.")}
            </p>
          ) : null}
          <Image src="/brand/patitas-isotipo.png" alt="" width={736} height={876} className="mx-auto h-20 w-auto opacity-35" />
          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.025em]">Todavía no agregaste productos</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Encontrá alimento, snacks y esenciales para tu perro o gato. Agregalos al carrito para empezar tu compra.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/perros"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-5 font-semibold text-white hover:bg-[#0048dc]"
            >
              Comprar para perros
            </Link>
            <Link
              href="/gatos"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-catalog-canvas px-5 font-semibold text-ink hover:text-brand-blue"
            >
              Comprar para gatos
            </Link>
          </div>
        </section>
        {recommendations}
      </div>
    );
  }

  return (
    <>
      <div className="grid items-start gap-5 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:pb-0">
        {checkoutMessage ? (
          <p role="alert" className="col-span-full rounded-lg bg-[#fff8e5] p-3 text-sm text-[#765400]">
            {checkoutMessage}
          </p>
        ) : null}
        <section aria-labelledby="cart-items-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="cart-items-title" className="font-display text-2xl font-semibold leading-tight tracking-[-0.025em]">
                Tu selección
              </h2>
              <p className="mt-1 text-sm text-muted" aria-live="polite">
                {items.reduce((total, item) => total + item.quantity, 0)} unidades
              </p>
            </div>
            <Link href="/perros" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-blue hover:underline">
              Seguir comprando
            </Link>
          </div>
          <p className="mb-4 rounded-lg bg-catalog-canvas p-3 text-sm text-muted lg:hidden">
            En el checkout confirmamos cobertura, disponibilidad y costo de envío con tu dirección.{" "}
            <Link href="/envios" className="font-semibold text-brand-blue underline underline-offset-2">
              Ver cómo funcionan los envíos
            </Link>
            .
          </p>

          <div className="overflow-hidden rounded-xl bg-white">
            {items.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-3 border-b border-catalog-line p-3 last:border-b-0 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:p-5"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
                  <ProductImage src={item.imageUrl} alt={item.productName} className="p-2" />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/producto/${item.slug}`}
                    className="mt-1 block max-w-[42ch] font-display text-lg font-semibold leading-5 hover:text-brand-blue sm:text-xl sm:leading-6"
                  >
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{item.presentation ?? "Presentación estándar"}</p>
                  {item.petId ? (
                    <p className="mt-1 text-sm font-semibold text-brand-blue">
                      Para {pets.find((pet) => pet.id === item.petId)?.name ?? "tu mascota"}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted">{formatMoney(Number(item.unitPrice))} por unidad</p>
                  {item.quantity > item.availableQuantity ? (
                    <p role="alert" className="mt-2 text-sm leading-6 text-[#8d2020]">
                      {item.availableQuantity > 0
                        ? `Quedan ${item.availableQuantity} unidades. Ajustá la cantidad para continuar.`
                        : "Sin stock por el momento. Quitá este producto para continuar."}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div
                      className="inline-flex items-center rounded-lg bg-catalog-canvas"
                      role="group"
                      aria-label={`Cantidad de ${item.productName}`}
                    >
                      <button
                        type="button"
                        onClick={() => void changeCart(() => updateQuantity(item.id, item.quantity - 1))}
                        disabled={changing || loading}
                        aria-label={`Restar una unidad de ${item.productName}`}
                        className="flex size-11 items-center justify-center rounded-lg hover:bg-brand-blue/10"
                      >
                        <Minus size={15} weight="bold" />
                      </button>
                      <span className="w-9 text-center text-base font-semibold tabular-nums" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => void changeCart(() => updateQuantity(item.id, item.quantity + 1))}
                        disabled={changing || loading || item.quantity >= item.availableQuantity}
                        aria-label={`Sumar una unidad de ${item.productName}`}
                        className="flex size-11 items-center justify-center rounded-lg hover:bg-brand-blue/10"
                      >
                        <Plus size={15} weight="bold" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeCartItem(item)}
                      disabled={changing || loading}
                      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted hover:text-[#8d2020]"
                    >
                      <Trash size={16} aria-hidden="true" /> Eliminar
                    </button>
                  </div>
                </div>
                <p className="col-span-2 font-display text-lg font-semibold tabular-nums sm:col-span-1 sm:text-right sm:text-xl">
                  {formatMoney(Number(item.lineTotal))}
                </p>
              </article>
            ))}
          </div>
          {error || mutationError ? (
            <p role="alert" className="mt-4 rounded-lg bg-[#fff1f1] p-3 text-sm text-[#8d2020]">
              {mutationError ?? readableCartError(error, "No pudimos actualizar el carrito. Intentá nuevamente.")}
            </p>
          ) : null}
          {undoItem ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-catalog-canvas p-3 text-sm" role="status">
              <span className="min-w-0 truncate">Quitaste {undoItem.productName} del carrito.</span>
              <button type="button" onClick={() => void undoRemove()} className="shrink-0 font-semibold text-brand-blue hover:underline">
                Deshacer
              </button>
            </div>
          ) : null}
        </section>

        <aside className="hidden h-fit rounded-xl bg-white p-5 sm:p-6 lg:sticky lg:top-6 lg:block" aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title" className="font-display text-2xl font-semibold leading-tight tracking-[-0.025em]">
            Resumen
          </h2>
          <div className="mt-5 flex items-center justify-between border-b border-catalog-line pb-5">
            <span className="text-muted">Subtotal</span>
            <strong className="font-display text-2xl tabular-nums">{formatMoney(subtotal)}</strong>
          </div>
          <div className="mt-5 flex gap-3 rounded-lg bg-catalog-canvas p-3 text-sm text-muted">
            <Truck size={20} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
            <p>
              En el siguiente paso confirmamos cobertura, disponibilidad y costo de envío con tu dirección.{" "}
              <Link href="/envios" className="font-semibold text-brand-blue underline underline-offset-2">
                Ver cómo funcionan los envíos
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            disabled={checkoutBlocked}
            onClick={goToCheckout}
            aria-describedby={stockNeedsReview ? "cart-stock-help" : undefined}
            className={`mt-6 hidden min-h-14 w-full items-center justify-center gap-2 rounded-xl px-5 font-semibold lg:inline-flex ${
              checkoutBlocked ? "cursor-not-allowed bg-catalog-soft text-muted" : "bg-brand-blue text-white hover:bg-[#0048dc]"
            }`}
          >
            {changing ? "Actualizando carrito…" : stockNeedsReview ? "Revisá los productos sin stock" : "Continuar con la compra"}{" "}
            <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </button>
          {stockNeedsReview ? (
            <p id="cart-stock-help" className="mt-3 text-sm text-[#8d2020]" role="status">
              Ajustá las cantidades marcadas para continuar.
            </p>
          ) : null}
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-catalog-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(24,33,43,0.12)] lg:hidden">
        <div className="mx-auto flex w-full max-w-[76rem] items-center gap-3">
          <div className="min-w-0 shrink-0">
            <p className="text-xs text-muted">Subtotal</p>
            <p className="font-display text-xl font-semibold tabular-nums text-ink">{formatMoney(subtotal)}</p>
          </div>
          <button
            type="button"
            disabled={checkoutBlocked}
            onClick={goToCheckout}
            aria-describedby={stockNeedsReview ? "cart-stock-help" : undefined}
            className={`inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-center text-sm font-semibold ${
              checkoutBlocked ? "cursor-not-allowed bg-catalog-soft text-muted" : "bg-brand-blue text-white hover:bg-[#0048dc]"
            }`}
          >
            <span className="truncate">
              {changing ? "Actualizando…" : stockNeedsReview ? "Revisá el stock" : "Continuar con la compra"}
            </span>
            <ArrowRight size={17} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}

function readableCartError(message: string | null, fallback: string) {
  if (!message) return fallback;
  if (/failed to fetch|network|networkerror|conect/i.test(message)) {
    return "No pudimos conectarnos. Revisá tu conexión y volvé a intentar.";
  }
  if (/401|no autentic|sesión.*expir/i.test(message)) {
    return "Tu sesión expiró. Iniciá sesión nuevamente o continuá como invitado.";
  }
  if (/403|no tenés permiso|forbidden/i.test(message)) {
    return "No tenés permiso para modificar este carrito.";
  }
  if (/404|no encontramos|not found/i.test(message)) {
    return "No encontramos ese producto en tu carrito. Actualizá la página para continuar.";
  }
  if (/429|too many|demasiad/i.test(message)) {
    return "Recibimos demasiados intentos seguidos. Esperá un momento y volvé a intentar.";
  }
  if (/500|502|503|504|servidor|service unavailable/i.test(message)) {
    return "El servicio está temporalmente ocupado. Esperá un momento y volvé a intentar.";
  }
  return message;
}
