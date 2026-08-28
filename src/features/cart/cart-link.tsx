"use client";

import { ShoppingCartSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { formatMoney } from "@/lib/catalog-formatters";
import { useCart } from "./cart-context";

export function CartLink({ mobile = false }: { mobile?: boolean }) {
  const { count, subtotal } = useCart();
  const itemLabel = count === 1 ? "producto" : "productos";
  const totalLabel = formatMoney(subtotal);

  return (
    <Link
      href="/carrito"
      aria-label={`Carrito${count ? `, ${count} ${itemLabel}, total ${totalLabel}` : " vacío"}`}
      className={mobile
        ? "flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold text-ink hover:bg-soft-blue"
        : "relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-2 text-white hover:bg-white/15"}
    >
      <span className={mobile ? "inline" : "sr-only"}>Carrito</span>
      <span className="relative inline-flex size-7 shrink-0 items-center justify-center">
        <ShoppingCartSimple size={23} weight="bold" aria-hidden="true" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-yellow px-1 text-[11px] font-bold text-ink">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </span>
      {count > 0 ? (
        <span className="whitespace-nowrap text-xs font-semibold tabular-nums sm:text-sm">{totalLabel}</span>
      ) : null}
    </Link>
  );
}
