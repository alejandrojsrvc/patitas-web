import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CartProvider } from "@/features/cart/cart-context";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { getServerCart, getServerCheckoutData } from "@/infrastructure/api/commerce-server";

export const metadata: Metadata = {
  title: "Checkout | Patitas Inquietas",
  robots: { index: false, follow: false },
};

export default function CheckoutPage({ searchParams }: { searchParams: Promise<{ sessionId?: string }> }) {
  return <Suspense fallback={<CheckoutPageFallback />}><CheckoutPageRuntime searchParams={searchParams} /></Suspense>;
}

async function CheckoutPageRuntime({ searchParams }: { searchParams: Promise<{ sessionId?: string }> }) {
  const { sessionId } = await searchParams;
  if (!sessionId) redirect("/checkout/iniciar");
  const [cart, checkout] = await Promise.all([getServerCart(), getServerCheckoutData(sessionId)]);
  return <CartProvider initialCart={cart} skipInitialRefresh><SiteHeader /><main id="contenido" className="min-h-[70vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell"><Link href="/carrito" className="text-sm font-semibold text-brand-blue hover:underline">← Volver al carrito</Link><h1 className="display-heading mt-4 text-4xl sm:mt-5 sm:text-6xl">Finalizar pedido</h1><p className="mb-7 mt-3 max-w-2xl text-base text-muted sm:mb-10 sm:text-lg">Completá tus datos, indicá dónde recibirlo y enviá la solicitud a Patitas API.</p><CheckoutForm initialSession={checkout?.session ?? null} initialShippingOptions={checkout?.shippingOptions ?? []} /></div></main><SiteFooter /></CartProvider>;
}

function CheckoutPageFallback() {
  return <><SiteHeader /><main id="contenido" className="min-h-[70vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell"><h1 className="display-heading mt-4 text-4xl sm:mt-5 sm:text-6xl">Finalizar pedido</h1><div className="mt-7 rounded-xl bg-white p-8 text-center text-muted">Cargando tu checkout…</div></div></main><SiteFooter /></>;
}
