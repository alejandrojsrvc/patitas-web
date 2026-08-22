import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CartProvider } from "@/features/cart/cart-context";
import { CartPageContent } from "@/features/cart/cart-page";
import { getServerCart } from "@/infrastructure/api/commerce-server";
export const metadata: Metadata = { title: "Carrito | Patitas Inquietas", robots: { index: false, follow: false } };

export default function CartPage() {
  return <Suspense fallback={<CartPageFallback />}><CartPageRuntime /></Suspense>;
}

async function CartPageRuntime() {
  const cart = await getServerCart();
  return <CartProvider initialCart={cart} skipInitialRefresh><SiteHeader /><main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell"><h1 className="display-heading text-4xl sm:text-6xl">Carrito</h1><p className="mt-3 max-w-xl text-base text-muted sm:text-lg">Revisá tus presentaciones y cantidades antes de confirmar el pedido.</p><div className="mt-7 sm:mt-9"><CartPageContent /></div></div></main><SiteFooter /></CartProvider>;
}

function CartPageFallback() {
  return <><SiteHeader /><main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell"><h1 className="display-heading text-4xl sm:text-6xl">Carrito</h1><div className="mt-7 rounded-xl bg-white p-8 text-center text-muted">Cargando tu carrito…</div></div></main><SiteFooter /></>;
}
