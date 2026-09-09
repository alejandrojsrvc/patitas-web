import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PaymentOrderView } from "@/features/orders/payment-order-view";
import { authCookieNames } from "@/lib/auth-cookies";

export const metadata: Metadata = {
  title: "Estado del pago | Patitas Inquietas",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const query = await searchParams;
  const cookieStore = await cookies();
  const orderId = query.orderId ?? cookieStore.get(authCookieNames.orderId)?.value;

  return <CheckoutResultLayout orderId={orderId} />;
}

function CheckoutResultLayout({ orderId }: { orderId?: string }) {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="container-shell min-h-[70vh] py-7 sm:py-12">
        <h1 className="display-heading mb-7 text-4xl sm:mb-10 sm:text-6xl">Estado de tu pago</h1>
        {orderId ? <PaymentOrderView orderId={orderId} /> : <MissingOrder />}
      </main>
      <SiteFooter />
    </>
  );
}

function MissingOrder() {
  return (
    <section className="mx-auto max-w-2xl rounded-xl bg-white p-7 sm:p-10">
      <p role="alert" className="rounded-xl bg-[#fff1f1] p-4 text-[#8d2020]">
        No pudimos identificar este pedido. Si ya pagaste, no vuelvas a pagar: revisá tu cuenta o contactanos con el correo usado en la
        compra.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/mi-cuenta/pedidos"
          className="inline-flex min-h-11 items-center rounded-xl bg-brand-blue px-4 font-semibold text-white"
        >
          Ver mis pedidos
        </Link>
        <Link href="/carrito" className="inline-flex min-h-11 items-center rounded-xl bg-catalog-canvas px-4 font-semibold text-ink">
          Volver al carrito
        </Link>
        <Link href="/perros" className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-brand-blue hover:bg-soft-blue">
          Seguir comprando
        </Link>
        <Link
          href="/contacto"
          className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-brand-blue hover:bg-soft-blue"
        >
          Contactarnos
        </Link>
      </div>
    </section>
  );
}
