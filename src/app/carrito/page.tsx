import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { emptyStorefrontShell } from "@/domain/storefront/types";
import { SessionRefreshBoundary } from "@/features/auth/session-refresh-boundary";
import { CartProvider } from "@/features/cart/cart-context";
import { CartPageContent } from "@/features/cart/cart-page";
import { getCartBootstrap } from "@/infrastructure/api/commerce-server";
export const metadata: Metadata = { title: "Carrito | Patitas Inquietas", robots: { index: false, follow: false } };

export default function CartPage({ searchParams }: { searchParams: Promise<{ checkoutError?: string }> }) {
  return <Suspense fallback={<CartPageFallback />}><CartPageRuntime searchParams={searchParams} /></Suspense>;
}

async function CartPageRuntime({ searchParams }: { searchParams: Promise<{ checkoutError?: string }> }) {
  const { checkoutError } = await searchParams;
  const result = await getCartBootstrap();
  if (result.refreshRequired) {
    return <SessionRefreshBoundary required failure={<CartRefreshFailure />}><CartPageFallback /></SessionRefreshBoundary>;
  }
  const screen = result.data;
  const shell = screen?.shell ?? emptyStorefrontShell;
  const checkoutMessage = result.error ?? (checkoutError === "checkout-unavailable"
    ? "No pudimos conectar con el checkout. Revisá tu carrito e intentá nuevamente en unos minutos."
    : checkoutError === "checkout-conflict"
      ? "Ese checkout ya no está disponible. Revisá tu carrito para iniciar uno nuevo."
      : checkoutError === "cart-unavailable"
        ? "No pudimos cargar el carrito para iniciar el checkout. Intentá nuevamente."
        : undefined);
  return <CartProvider initialCart={screen?.cart ?? shell.cart}><SiteHeader initialShell={shell} /><main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell"><h1 className="display-heading text-4xl sm:text-6xl">Carrito</h1><p className="mt-3 max-w-xl text-base text-muted sm:text-lg">Revisá tus presentaciones y cantidades antes de confirmar el pedido.</p><div className="mt-7 sm:mt-9"><CartPageContent checkoutMessage={checkoutMessage} /></div></div></main><SiteFooter /></CartProvider>;
}

function CartPageFallback() {
  return <CartProvider initialCart={emptyStorefrontShell.cart}><SiteHeader initialShell={emptyStorefrontShell} /><main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell"><h1 className="display-heading text-4xl sm:text-6xl">Carrito</h1><div className="mt-7 rounded-xl bg-white p-8 text-center text-muted">Cargando tu carrito…</div></div></main><SiteFooter /></CartProvider>;
}

function CartRefreshFailure() {
  return <CartProvider initialCart={emptyStorefrontShell.cart}><SiteHeader initialShell={emptyStorefrontShell} /><main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-7 sm:py-12"><div className="container-shell rounded-xl bg-white p-8"><h1 className="font-display text-2xl font-semibold">No pudimos renovar tu sesión</h1><p className="mt-2 text-muted">Tu carrito anónimo se conserva. Iniciá sesión nuevamente para recuperar el carrito de tu cuenta.</p></div></main><SiteFooter /></CartProvider>;
}
