import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { GuestOrderPage } from "@/features/orders/guest-order-page";

export const metadata: Metadata = { title: "Pedido | Patitas Inquietas", robots: { index: false, follow: false } };

export default async function GuestOrderRoute({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-7 sm:py-12">
        <div className="container-shell">
          <GuestOrderPage orderId={(await params).id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
