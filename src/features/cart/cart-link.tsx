"use client";

import { ShoppingCartSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useCart } from "./cart-context";

export function CartLink({ mobile = false }: { mobile?: boolean }) {
  const { count } = useCart();
  return (
    <Link
      href="/carrito"
      aria-label={`Carrito${count ? `, ${count} productos` : " vacío"}`}
      className={mobile
        ? "flex min-h-12 items-center justify-between rounded-xl px-3 font-semibold text-ink hover:bg-soft-blue"
        : "relative inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-soft-blue"}
    >
      <span className={mobile ? "inline" : "sr-only"}>Carrito</span>
      <ShoppingCartSimple size={23} weight="bold" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-yellow px-1 text-[11px] font-bold text-ink">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
