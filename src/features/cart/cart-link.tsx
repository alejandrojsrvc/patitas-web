"use client";

import { ShoppingCartSimple } from "@phosphor-icons/react";
import Link from "next/link";
import type { StorefrontCartSummary } from "@/domain/storefront/types";
import { formatMoney } from "@/lib/catalog-formatters";
import { useCart } from "./cart-context";

export function CartLink({
  mobile = false,
  initialSummary,
  onBrand = false,
}: {
  mobile?: boolean;
  initialSummary?: StorefrontCartSummary;
  onBrand?: boolean;
}) {
  const cart = useCart();
  const count = cart.hasState ? cart.count : (initialSummary?.itemCount ?? 0);
  const subtotal = cart.hasState ? cart.subtotal : Number(initialSummary?.subtotal ?? 0);
  const itemLabel = count === 1 ? "producto" : "productos";
  const totalLabel = formatMoney(subtotal);

  return (
    <Link
      href="/carrito"
      aria-label={`Carrito${count ? `, ${count} ${itemLabel}, total ${totalLabel}` : " vacío"}`}
      className={
        mobile
          ? `flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold ${onBrand ? "text-white hover:bg-white/10" : "text-ink hover:bg-soft-blue"}`
          : `relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-2 ${onBrand ? "text-white hover:bg-white/10" : "text-ink hover:bg-catalog-soft"}`
      }
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
      {count > 0 ? <span className="whitespace-nowrap text-xs font-semibold tabular-nums sm:text-sm">{totalLabel}</span> : null}
    </Link>
  );
}
