"use client";

import { Check, ShoppingCartSimple } from "@phosphor-icons/react";
import { useState } from "react";
import type { ProductVariant } from "@/domain/catalog/types";
import { useCart } from "./cart-context";

export function AddToCartButton({
  variant,
  compact = false,
  quantity = 1,
}: {
  variant: ProductVariant;
  compact?: boolean;
  quantity?: number;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const disabled = !variant.fulfillment.purchasable;

  async function add() {
    setLoading(true);
    setError(false);
    try {
      await addItem(variant.id, quantity);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={add}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed ${compact ? "min-h-11 w-full bg-brand-blue px-3 text-xs text-white hover:bg-[#0048dc] disabled:bg-[#a8b9dc]" : "min-h-14 w-full bg-brand-blue px-8 text-base text-white hover:bg-[#0048dc] disabled:bg-[#a8b9dc]"}`}
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
          ? "Guardando…"
          : added
            ? "Agregado al carrito"
            : error
              ? "Reintentar"
              : compact
                ? "Agregar al carrito"
                : "Comprar"}
    </button>
  );
}
