import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { emptyStorefrontShell, type ApiAccountSection } from "@/domain/storefront/types";
import { AccountPage } from "@/features/account/account-page";
import { SessionRefreshBoundary } from "@/features/auth/session-refresh-boundary";
import { CartProvider } from "@/features/cart/cart-context";
import { getAccountScreen } from "@/infrastructure/api/commerce-server";

export const metadata: Metadata = { title: "Mi cuenta | Patitas Inquietas", robots: { index: false, follow: false } };

type AccountRouteProps = {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ page?: string }>;
};

export default function AccountRoute({ params, searchParams }: AccountRouteProps) {
  return <Suspense fallback={<AccountPageFallback />}><AccountRouteRuntime params={params} searchParams={searchParams} /></Suspense>;
}

async function AccountRouteRuntime({ params, searchParams }: AccountRouteProps) {
  const segments = (await params).section ?? [];
  const section = (["resumen", "pedidos", "direcciones", "mascotas", "reposiciones"] as const).includes(segments[0] as never) ? segments[0] as "resumen" | "pedidos" | "direcciones" | "mascotas" | "reposiciones" : "resumen";
  const apiSection = accountSectionMap[section];
  const requestedPage = Number((await searchParams).page);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const result = await getAccountScreen({
    section: apiSection,
    orderId: section === "pedidos" ? segments[1] : undefined,
    page: apiSection === "orders" ? page : undefined,
    perPage: apiSection === "orders" ? 10 : undefined,
  });

  if (result.refreshRequired) {
    return <SessionRefreshBoundary required failure={<AccountRefreshFailure />}><AccountPageFallback /></SessionRefreshBoundary>;
  }

  const shell = result.data?.shell ?? emptyStorefrontShell;
  const screenKey = result.data?.shell.viewer.authenticated
    ? `${result.data.shell.viewer.id}-${result.data.section.type}-${segments[1] ?? page}`
    : "guest";

  return <CartProvider key={`account-${screenKey}`} initialCart={shell.cart}><SiteHeader initialShell={shell} /><main id="contenido" className="container-shell min-h-[65vh] bg-catalog-canvas py-7 sm:py-12"><AccountPage key={screenKey} section={section} initialData={result.data} initialError={result.error} /></main><SiteFooter /></CartProvider>;
}

function AccountPageFallback() {
  return <CartProvider initialCart={emptyStorefrontShell.cart}><SiteHeader initialShell={emptyStorefrontShell} /><main id="contenido" className="container-shell min-h-[65vh] bg-catalog-canvas py-7 sm:py-12"><div className="rounded-xl bg-white p-8 text-center text-muted">Cargando tu cuenta…</div></main><SiteFooter /></CartProvider>;
}

function AccountRefreshFailure() {
  return <CartProvider initialCart={emptyStorefrontShell.cart}><SiteHeader initialShell={emptyStorefrontShell} /><main id="contenido" className="container-shell min-h-[65vh] bg-catalog-canvas py-7 sm:py-12"><div className="rounded-xl bg-white p-8"><h1 className="font-display text-2xl font-semibold">No pudimos renovar tu sesión</h1><p className="mt-2 text-muted">Intentá nuevamente o iniciá sesión otra vez.</p></div></main><SiteFooter /></CartProvider>;
}

const accountSectionMap: Record<"resumen" | "pedidos" | "direcciones" | "mascotas" | "reposiciones", ApiAccountSection> = {
  resumen: "overview",
  pedidos: "orders",
  direcciones: "addresses",
  mascotas: "pets",
  reposiciones: "replenishments",
};
