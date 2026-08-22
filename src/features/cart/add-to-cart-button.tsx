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
  const disabled = !variant.fulfillment.purchasable;

  async function add() {
    setLoading(true);
    try {
      await addItem(variant.id, quantity);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={add}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#0048dc] disabled:cursor-not-allowed disabled:bg-[#a8b9dc] ${compact ? "min-h-10 min-w-24 px-2 text-[11px] sm:px-3 sm:text-xs" : "min-h-13 px-5"}`}
    >
      {added ? <Check size={18} weight="bold" aria-hidden="true" /> : <ShoppingCartSimple size={18} weight="bold" aria-hidden="true" />}
      {disabled ? "Sin stock" : loading ? "Guardando…" : added ? "Agregado" : "Agregar"}
    </button>
  );
}
