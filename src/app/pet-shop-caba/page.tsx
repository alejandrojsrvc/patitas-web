import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, MapPin, Package, ShoppingBagOpen } from "@phosphor-icons/react/ssr";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL no está configurada.");

export const metadata: Metadata = {
  title: "Pet shop online en CABA | Patitas Inquietas",
  description:
    "Comprá alimento, arena y esenciales para perros y gatos con entrega en CABA. También podés calcular cuándo volver a reponer su alimento.",
  alternates: { canonical: "/pet-shop-caba" },
  openGraph: {
    title: "Pet shop online en CABA | Patitas Inquietas",
    description: "Una tienda online para comprar lo que tu mascota ya consume y calcular cuándo volver a reponerlo.",
    type: "website",
    locale: "es_AR",
    siteName: "Patitas Inquietas",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name: "Pet shop online en CABA",
      description: "Tienda online de alimento y esenciales para perros y gatos con cobertura en CABA.",
      url: `${siteUrl}/pet-shop-caba`,
      inLanguage: "es-AR",
      about: { "@type": "City", name: "Ciudad Autónoma de Buenos Aires", alternateName: "CABA" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Pet shop online en CABA", item: `${siteUrl}/pet-shop-caba` },
      ],
    },
  ],
};

export default function PetShopCabaPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenido">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <section className="bg-brand-blue py-16 text-white sm:py-24">
          <div className="container-shell">
            <p className="flex items-center gap-2 text-sm font-semibold text-white/75">
              <MapPin size={18} /> Entregas en CABA
            </p>
            <h1 className="display-heading mt-5 max-w-4xl text-5xl sm:text-7xl">Tu pet shop online en CABA, con lo de siempre a mano.</h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-white/75">
              Encontrá alimento, arena y esenciales para perros y gatos. Comprá una vez o calculá cuándo vas a necesitar reponer su
              alimento.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/perros"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand-yellow px-6 font-semibold text-ink"
              >
                <ShoppingBagOpen size={20} /> Ver catálogo
              </Link>
              <Link
                href="/calculadora-alimento"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/35 px-6 font-semibold text-white hover:bg-white/10"
              >
                <Calculator size={20} /> Calcular reposición
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-page-bg py-16 sm:py-20">
          <div className="container-shell grid gap-8 md:grid-cols-3">
            <article className="border-t border-border pt-6">
              <ShoppingBagOpen size={32} className="text-brand-blue" />
              <h2 className="mt-6 font-display text-3xl font-semibold">Comprá online</h2>
              <p className="mt-3 leading-7 text-muted">Elegí productos publicados, compará presentaciones y recibí tu pedido en CABA.</p>
            </article>
            <article className="border-t border-border pt-6">
              <Calculator size={32} className="text-brand-blue" />
              <h2 className="mt-6 font-display text-3xl font-semibold">Calculá cuánto dura</h2>
              <p className="mt-3 leading-7 text-muted">
                Usá la presentación, el peso y la etapa de tu mascota para obtener una estimación clara.
              </p>
            </article>
            <article className="border-t border-border pt-6">
              <Package size={32} className="text-brand-blue" />
              <h2 className="mt-6 font-display text-3xl font-semibold">Reponé a tiempo</h2>
              <p className="mt-3 leading-7 text-muted">
                Más adelante vas a poder recibir un recordatorio antes de que se termine su alimento.
              </p>
            </article>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="container-shell grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-blue">Cobertura</p>
              <h2 className="display-heading mt-4 max-w-3xl text-4xl sm:text-5xl">Una operación online pensada para CABA.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                No tenemos local físico. La cobertura, el costo y el plazo se validan con tu dirección durante el checkout, según las reglas
                de entrega disponibles.
              </p>
              <Link href="/envios" className="mt-6 inline-flex font-semibold text-brand-blue hover:underline">
                Ver información de envíos →
              </Link>
            </div>
            <div className="rounded-2xl bg-soft-blue p-7">
              <h2 className="font-display text-2xl font-semibold">¿Ya sabés qué come?</h2>
              <p className="mt-3 leading-7 text-muted">
                Buscá la marca y la presentación habitual. Si necesitás orientación, la calculadora te ayuda a estimar la próxima
                reposición.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/buscar"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-5 font-semibold text-white"
                >
                  Buscar productos
                </Link>
                <Link
                  href="/reponer"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 font-semibold text-ink"
                >
                  Conocer reposición
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
