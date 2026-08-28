import type { Metadata } from "next";
import { CheckCircle } from "@phosphor-icons/react/ssr";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Estado del pedido | Patitas Inquietas",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="container-shell flex min-h-[70vh] items-center py-16">
        <div className="max-w-2xl rounded-2xl bg-soft-blue p-8 sm:p-12">
          <CheckCircle size={44} weight="duotone" className="text-brand-blue" />
          <h1 className="display-heading mt-6 text-5xl">Recibimos tu pedido.</h1>
          <p className="mt-5 text-lg text-muted">Patitas API recibió la solicitud y va a validar stock, cobertura y datos de entrega.</p>
          <p className="mt-3 text-sm text-muted">El estado final del pago se confirma con Mercado Pago y el webhook de Patitas. No tomamos el retorno del navegador como prueba única de pago.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/mi-cuenta/pedidos" className="inline-flex min-h-13 items-center rounded-xl bg-brand-blue px-5 font-semibold text-white">Ver mis pedidos</Link>
            <Link href="/" className="inline-flex min-h-13 items-center rounded-xl border border-border bg-white px-5 font-semibold">Volver al inicio</Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
