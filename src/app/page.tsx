import { ArrowRight, Calculator, CreditCard, MapPin, Package, PawPrint } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FAQ } from "@/components/sections/faq";
import { HomeHeroCarousel } from "@/components/sections/home-hero-carousel";
import { RecentProducts } from "@/components/sections/recent-products";
import type { Brand } from "@/domain/catalog/types";
import { brandLogoUrl } from "@/lib/brand-assets";
import { getBrands, getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";
import { cacheLife, cacheTag } from "next/cache";

export const metadata: Metadata = {
  title: "Pet shop online en CABA | Patitas Inquietas",
  description:
    "Comprá alimento balanceado, arena, snacks y esenciales para perros y gatos en CABA. Encontrá marcas y presentaciones sin vueltas.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Pet shop online en CABA | Patitas Inquietas",
    description: "Alimento balanceado, arena y esenciales para perros y gatos, con una compra simple y ayuda humana.",
    type: "website",
    locale: "es_AR",
    siteName: "Patitas Inquietas",
    images: [
      {
        url: "/brand/landing/hero-patitas-caba-v2.webp",
        width: 1197,
        height: 450,
        alt: "Reponé el alimento de tu mascota a tiempo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pet shop online en CABA | Patitas Inquietas",
    description: "Alimento balanceado, arena y esenciales para perros y gatos en CABA.",
    images: ["/brand/landing/hero-patitas-caba-v2.webp"],
  },
};

const categories = [
  {
    title: "Alimento para perros",
    image: "/brand/landing/categories/dog-food.webp",
    alt: "Perro comiendo alimento de su plato",
    links: [["Ver alimentos", "/perros/alimentos"]],
  },
  {
    title: "Alimento para gatos",
    image: "/brand/landing/categories/cat-food.webp",
    alt: "Gato comiendo alimento de su plato",
    links: [["Ver alimentos", "/gatos/alimentos"]],
  },
  {
    title: "Arena e higiene",
    image: "/brand/landing/categories/cat-hygiene.webp",
    alt: "Gato junto a una bandeja sanitaria",
    links: [["Ver arena", "/gatos/arena"]],
  },
  {
    title: "Snacks y premios",
    image: "/brand/landing/categories/snacks.webp",
    alt: "Perro recibiendo un snack",
    links: [["Ver snacks", "/buscar?category=snacks"]],
  },
  {
    title: "Bolsitas y esenciales",
    image: "/brand/landing/categories/walk-essentials.webp",
    alt: "Bolsita para recoger los residuos durante el paseo",
    links: [["Ver esenciales", "/perros/bolsas"]],
  },
] as const;

const preferredBrandOrder = ["excellent", "pro plan", "old prince", "royal canin", "pedigree", "vital can", "dog chow", "cat chow"];

function availableBrands(brands: Brand[]): Brand[] {
  return brands
    .sort((left, right) => {
      const leftIndex = preferredBrandOrder.indexOf(left.name.toLocaleLowerCase("es-AR"));
      const rightIndex = preferredBrandOrder.indexOf(right.name.toLocaleLowerCase("es-AR"));
      if (leftIndex !== -1 || rightIndex !== -1) {
        return (leftIndex === -1 ? preferredBrandOrder.length : leftIndex) - (rightIndex === -1 ? preferredBrandOrder.length : rightIndex);
      }
      return left.name.localeCompare(right.name, "es-AR");
    })
    .slice(0, 8);
}

export default async function Home() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 86400 });
  cacheTag("catalog-products", "catalog-brands");
  const [featuredResult, brandsResult] = await Promise.all([
    safeCatalogCall(() => getProducts({ featured: true, perPage: 8 })),
    safeCatalogCall(() => getBrands()),
  ]);
  const featuredProducts = featuredResult.ok && featuredResult.data.items.length ? featuredResult.data.items.slice(0, 8) : [];
  const brands = availableBrands(brandsResult.ok ? brandsResult.data : []);
  return (
    <>
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-brand-yellow px-4 py-3 font-semibold text-ink transition-transform focus-visible:translate-y-0"
      >
        Ir al contenido
      </a>
      <SiteHeader publicOnly />
      <main id="contenido">
        <section className="py-4 sm:py-6 lg:py-8">
          <div className="container-shell">
            <h1 className="sr-only">Reponé el alimento de tu mascota a tiempo</h1>
            <HomeHeroCarousel />
          </div>
        </section>

        <section className="bg-white" aria-label="Cómo comprar">
          <div className="container-shell grid md:grid-cols-3">
            <div className="flex items-center gap-3 py-4 md:px-5 md:first:pl-0">
              <MapPin size={22} weight="duotone" className="shrink-0 text-brand-blue" />
              <p className="text-sm">
                <strong className="block text-ink">Entrega en CABA</strong>
                <span className="text-muted">Confirmá dirección, costo y horario en el checkout.</span>
              </p>
            </div>
            <div className="flex items-center gap-3 py-4 md:px-5">
              <Package size={22} weight="duotone" className="shrink-0 text-brand-blue" />
              <p className="text-sm">
                <strong className="block text-ink">Elegí tu presentación</strong>
                <span className="text-muted">Compará peso, precio y disponibilidad.</span>
              </p>
            </div>
            <div className="flex items-center gap-3 py-4 md:px-5 md:last:pr-0">
              <CreditCard size={22} weight="duotone" className="shrink-0 text-brand-blue" />
              <p className="text-sm">
                <strong className="block text-ink">Pagá online</strong>
                <span className="text-muted">Revisá el total antes de confirmar.</span>
              </p>
            </div>
          </div>
        </section>

        <RecentProducts />

        <section className="bg-white py-14 sm:py-20" aria-labelledby="categories-title">
          <div className="container-shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="categories-title" className="display-heading text-4xl sm:text-5xl">
                  Comprá por categoría
                </h2>
              </div>
              <Link href="/buscar" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:underline">
                Ver todo el catálogo <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
            <div className="no-scrollbar -mx-2 mt-6 flex snap-x gap-3 overflow-x-auto px-2 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
              {categories.map((category) => (
                <Link
                  key={category.title}
                  href={category.links[0][1]}
                  className="group relative flex aspect-[2/3] w-[11.5rem] shrink-0 snap-start overflow-hidden rounded-xl bg-white text-white transition-colors lg:w-full"
                >
                  <span className="absolute inset-0">
                    <Image
                      unoptimized
                      src={category.image}
                      alt={category.alt}
                      fill
                      sizes="(min-width: 1024px) 18vw, 184px"
                      className="object-cover object-center"
                    />
                  </span>
                  <span
                    className="absolute inset-0 bg-gradient-to-t from-store-navy/90 via-store-navy/25 to-transparent"
                    aria-hidden="true"
                  />
                  <h3 className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 text-center font-display text-base font-semibold uppercase leading-5 tracking-[0.04em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] lg:text-lg">
                    {category.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {featuredProducts.length ? (
          <section className="bg-white py-14 sm:py-20" aria-labelledby="featured-title">
            <div className="container-shell">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <h2 id="featured-title" className="display-heading text-4xl sm:text-5xl">
                    Productos destacados
                  </h2>
                  <p className="mt-4 max-w-xl text-muted">Una selección de alimentos y esenciales para resolver tu próxima compra.</p>
                </div>
                <Link
                  href="/buscar"
                  className="inline-flex items-center gap-2 font-semibold text-brand-blue underline-offset-4 hover:underline"
                >
                  Ver todos <ArrowRight size={18} weight="bold" />
                </Link>
              </div>
              <div className="mt-9">
                <ProductGrid products={featuredProducts} variant="featured" />
              </div>
            </div>
          </section>
        ) : null}

        {brands.length ? (
          <section className="bg-white py-14 sm:py-20" aria-labelledby="brands-title">
            <div className="container-shell">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <h2 id="brands-title" className="display-heading text-4xl sm:text-5xl">
                    Las marcas que ya conocés
                  </h2>
                  <p className="mt-4 max-w-xl text-muted">Encontrá rápido la marca y la presentación que buscás.</p>
                </div>
                <Link
                  href="/marcas"
                  className="inline-flex items-center gap-2 font-semibold text-brand-blue underline-offset-4 hover:underline"
                >
                  Ver todas las marcas <ArrowRight size={18} weight="bold" />
                </Link>
              </div>
              <div className="mt-9 grid grid-cols-2 gap-x-1 gap-y-4 sm:grid-cols-4 sm:gap-x-3">
                {brands.map((brand) => {
                  const logoUrl = brandLogoUrl(brand);
                  return (
                    <Link
                      key={brand.id}
                      href={`/marcas/${brand.slug}`}
                      className="group flex min-h-28 flex-col items-center justify-center gap-2 p-4 text-center transition-opacity hover:opacity-75"
                    >
                      {logoUrl ? (
                        <span className="relative h-16 w-full max-w-28">
                          <Image
                            unoptimized
                            src={logoUrl}
                            alt={brand.name}
                            fill
                            sizes="112px"
                            className="object-contain"
                          />
                        </span>
                      ) : (
                        <span className="flex h-12 items-center justify-center text-brand-blue" aria-hidden="true">
                          <PawPrint size={36} weight="duotone" />
                        </span>
                      )}
                      <span className="sr-only">Ver productos {brand.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-brand-blue py-14 text-white sm:py-20" aria-labelledby="calculator-title">
          <div className="container-shell grid items-center gap-8 lg:grid-cols-[auto_1fr_auto] lg:gap-10">
            <span className="flex size-14 items-center justify-center rounded-xl bg-white/10 text-brand-yellow">
              <Calculator size={28} weight="duotone" />
            </span>
            <div>
              <h2 id="calculator-title" className="display-heading max-w-3xl text-3xl sm:text-4xl">
                Calculá cuánto rinde su alimento
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-white/70">
                Elegí alimento, presentación y peso. Te mostramos si el cálculo usa la tabla del fabricante o una estimación general.
              </p>
            </div>
            <Link
              href="/calculadora-alimento"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-yellow px-6 font-semibold text-ink hover:bg-[#f1df00]"
            >
              Abrir calculadora <ArrowRight size={19} weight="bold" />
            </Link>
          </div>
        </section>

        <FAQ />
      </main>
      <SiteFooter />
    </>
  );
}
