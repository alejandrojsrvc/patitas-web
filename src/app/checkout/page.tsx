import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { emptyStorefrontShell } from "@/domain/storefront/types";
import { SessionRefreshBoundary } from "@/features/auth/session-refresh-boundary";
import { CartHydrator } from "@/features/cart/cart-context";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { getCheckoutBootstrap } from "@/infrastructure/api/commerce-server";

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
  const result = await getCheckoutBootstrap(sessionId);
  if (result.refreshRequired) {
    return <SessionRefreshBoundary required failure={<CheckoutRefreshFailure />}><CheckoutPageFallback /></SessionRefreshBoundary>;
  }
  const checkout = result.data;
  const shell = checkout?.shell ?? emptyStorefrontShell;
  return <><CartHydrator cart={shell.cart} /><SiteHeader initialShell={shell} /><main id="contenido" className="min-h-[70vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell"><Link href="/carrito" className="text-sm font-semibold text-brand-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue">← Volver al carrito</Link><h1 className="display-heading mt-4 text-3xl sm:mt-5 sm:text-4xl">Finalizar pedido</h1><p className="mb-7 mt-2 max-w-xl text-base text-muted sm:mb-9">Tus datos, entrega y pago en un solo lugar.</p>{checkout ? <CheckoutForm initialSession={checkout.session} initialShippingOptions={checkout.shippingOptions} initialPaymentMethods={checkout.paymentMethods} savedAddresses={checkout.savedAddresses} /> : <CheckoutUnavailable message={result.error} />}</div></main><SiteFooter /></>;
}

function CheckoutPageFallback() {
  return <><CartHydrator cart={emptyStorefrontShell.cart} /><SiteHeader initialShell={emptyStorefrontShell} /><main id="contenido" className="min-h-[70vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell"><h1 className="display-heading mt-4 text-3xl sm:mt-5 sm:text-4xl">Finalizar pedido</h1><div className="mt-7 rounded-xl bg-white p-8 text-center text-muted">Cargando tu checkout…</div></div></main><SiteFooter /></>;
}

function CheckoutUnavailable({ message }: { message: string | null }) {
  return <section className="rounded-xl bg-white p-7"><h2 className="font-display text-2xl font-semibold">No pudimos recuperar este checkout</h2><p className="mt-2 text-muted">{message ?? "Volvé al carrito para iniciar una sesión nueva."}</p><Link href="/carrito" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-blue px-4 font-semibold text-white">Volver al carrito</Link></section>;
}

function CheckoutRefreshFailure() {
  return <><CartHydrator cart={emptyStorefrontShell.cart} /><SiteHeader initialShell={emptyStorefrontShell} /><main id="contenido" className="min-h-[70vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell rounded-xl bg-white p-8"><h1 className="font-display text-2xl font-semibold">No pudimos renovar tu sesión</h1><p className="mt-2 text-muted">Volvé a iniciar sesión antes de continuar con el pago.</p></div></main><SiteFooter /></>;
}
