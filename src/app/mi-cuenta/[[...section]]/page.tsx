import type { Metadata } from "next";
import Link from "next/link";

import { AccountPage } from "@/features/account/account-page";
import { AccountProvider } from "@/features/account/account-context";
import { resolveAccountRoute } from "@/features/account/account-routing";
import { SessionRefreshBoundary } from "@/features/auth/session-refresh-boundary";
import { getAccountScreen } from "@/infrastructure/api/commerce-server";

export const metadata: Metadata = { title: "Mi cuenta | Patitas Inquietas", robots: { index: false, follow: false } };
export const instant = false;

type AccountRouteProps = {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function AccountRoute({ params, searchParams }: AccountRouteProps) {
  const segments = (await params).section ?? [];
  const requestedPage = Number((await searchParams).page);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const route = resolveAccountRoute(segments, page);
  const content = (
    <AccountPage
      key={`${route.section}:${route.request.orderId ?? route.request.page ?? 1}`}
      section={route.section}
      request={route.request}
    />
  );

  if (route.section === "resumen") return content;

  const result = await getAccountScreen(route.request);
  if (result.refreshRequired) {
    return (
      <SessionRefreshBoundary required failure={<AccountSectionRefreshFailure />}>
        <AccountSectionLoading />
      </SessionRefreshBoundary>
    );
  }

  return (
    <AccountProvider
      initialData={result.data}
      initialError={result.error}
      initialRequest={route.request}
      initialGuest={!result.data && !result.error}
    >
      {content}
    </AccountProvider>
  );
}

function AccountSectionLoading() {
  return (
    <div className="mt-7 space-y-4" aria-busy="true" aria-label="Cargando datos de tu cuenta">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-white" />
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

function AccountSectionRefreshFailure() {
  return (
    <section className="mt-7 rounded-2xl border border-catalog-line bg-white p-6">
      <h2 className="font-display text-xl font-semibold">Tu sesión venció</h2>
      <p className="mt-2 text-muted">Iniciá sesión de nuevo para consultar estos datos.</p>
      <Link href="/mi-cuenta" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-blue px-4 font-semibold text-white">
        Iniciar sesión
      </Link>
    </section>
  );
}
