import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AccountPage } from "@/features/account/account-page";

export const metadata: Metadata = { title: "Mi cuenta | Patitas Inquietas", robots: { index: false, follow: false } };

export default async function AccountRoute({ params }: { params: Promise<{ section?: string[] }> }) {
  const segments = (await params).section ?? [];
  const section = (["resumen", "pedidos", "direcciones", "mascotas", "reposiciones"] as const).includes(segments[0] as never) ? segments[0] as "resumen" | "pedidos" | "direcciones" | "mascotas" | "reposiciones" : "resumen";
  return <><SiteHeader /><main id="contenido" className="container-shell min-h-[65vh] bg-catalog-canvas py-7 sm:py-12"><AccountPage section={section} orderId={segments[1]} /></main><SiteFooter /></>;
}
