import { ArrowRight, CreditCard, MapPin, Package, PawPrint } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FAQ } from "@/components/sections/faq";
import { HomeHero } from "@/components/sections/home-hero";
import { RecentProducts } from "@/components/sections/recent-products";
import type { Brand } from "@/domain/catalog/types";
import { brandLogoUrl } from "@/lib/brand-assets";
import { getBrands, getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";

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
    links: [["Ver alimentos", "/perros/alimentos-balanceados"]],
  },
  {
    title: "Alimento para gatos",
    image: "/brand/landing/categories/cat-food.webp",
    links: [["Ver alimentos", "/gatos/alimentos-balanceados"]],
  },
  {
    title: "Arena e higiene",
    image: "/brand/landing/categories/cat-hygiene.webp",
    links: [["Ver arena", "/gatos/higiene/arena"]],
  },
  {
    title: "Snacks y premios",
    image: "/brand/landing/categories/snacks.webp",
    links: [["Ver snacks", "/perros/snacks"]],
  },
  {
    title: "Bolsitas y esenciales",
    image: "/brand/landing/categories/walk-essentials.webp",
    links: [["Ver esenciales", "/perros/higiene/bolsas"]],
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
  const [featuredResult, brandsResult] = await Promise.all([
    safeCatalogCall(() => getProducts({ featured: true, perPage: 4 })),
    safeCatalogCall(() => getBrands()),
  ]);
  const featuredProducts = featuredResult.ok && featuredResult.data.items.length ? featuredResult.data.items.slice(0, 4) : [];
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
        <HomeHero />

        <section className="border-y border-border bg-white" aria-label="Cómo comprar">
          <div className="container-shell grid md:grid-cols-3">
            <div className="flex items-center gap-3 py-4 md:px-5 md:first:pl-0">
              <MapPin size={22} weight="duotone" className="shrink-0 text-brand-blue" aria-hidden="true" />
              <p className="text-sm">
                <strong className="block text-ink">Entrega en CABA</strong>
                <span className="text-muted">Confirmá dirección, costo y horario en el checkout.</span>
              </p>
            </div>
            <div className="flex items-center gap-3 py-4 md:px-5">
              <Package size={22} weight="duotone" className="shrink-0 text-brand-blue" aria-hidden="true" />
              <p className="text-sm">
                <strong className="block text-ink">Elegí tu presentación</strong>
                <span className="text-muted">Compará peso, precio y disponibilidad.</span>
              </p>
            </div>
            <div className="flex items-center gap-3 py-4 md:px-5 md:last:pr-0">
              <CreditCard size={22} weight="duotone" className="shrink-0 text-brand-blue" aria-hidden="true" />
              <p className="text-sm">
                <strong className="block text-ink">Pagá online</strong>
                <span className="text-muted">Revisá el total antes de confirmar.</span>
              </p>
            </div>
          </div>
        </section>

        <section className="bg-soft-blue py-14 sm:py-20" aria-labelledby="categories-title">
          <div className="container-shell">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="categories-title" className="display-heading text-4xl sm:text-5xl">
                  Comprá por categoría
                </h2>
              </div>
              <Link href="/perros" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:underline">
                Ver todo el catálogo <ArrowRight size={16} weight="bold" aria-hidden="true" />
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
                      src={category.image}
                      alt=""
                      fill
                      unoptimized={false}
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
            <p className="mt-3 text-xs text-muted lg:hidden">Deslizá para ver todas las categorías.</p>
          </div>
        </section>

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
                href="/perros"
                className="inline-flex items-center gap-2 font-semibold text-brand-blue underline-offset-4 hover:underline"
              >
                Ver todos <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-9">
              <ProductGrid
                products={featuredProducts}
                variant="featured"
                emptyAction={{ href: "/perros", label: "Explorar catálogo" }}
                emptyCopy={
                  featuredResult.ok
                    ? "Todavía no hay productos destacados publicados. Podés explorar el catálogo completo."
                    : "No pudimos cargar los destacados en este momento. Podés seguir explorando el catálogo completo."
                }
              />
            </div>
          </div>
        </section>

        <RecentProducts />

        <section className="bg-catalog-canvas py-14 sm:py-20" aria-labelledby="brands-title">
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
                Ver todas las marcas <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
            </div>
            {brands.length ? (
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
                          <Image src={logoUrl} alt="" fill unoptimized={false} sizes="112px" className="object-contain" />
                        </span>
                      ) : (
                        <span className="flex h-12 items-center justify-center text-brand-blue" aria-hidden="true">
                          <PawPrint size={36} weight="duotone" />
                        </span>
                      )}
                      <span className="text-sm font-semibold text-ink transition-colors group-hover:text-brand-blue">{brand.name}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-9 flex flex-col items-start gap-4 border-t border-catalog-line pt-7 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-muted">
                  {brandsResult.ok
                    ? "Estamos preparando la selección de marcas publicadas."
                    : "No pudimos cargar las marcas en este momento."}
                </p>
                <Link href="/perros" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-blue hover:underline">
                  Explorar productos <ArrowRight size={18} weight="bold" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <FAQ />

        <section className="bg-white py-14 sm:py-20" aria-labelledby="home-closing-title">
          <div className="container-shell flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <h2 id="home-closing-title" className="display-heading max-w-3xl text-4xl sm:text-5xl">
                Resolvé la compra de hoy. Anticipá la próxima cuando quieras.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
                Comprá sin suscribirte y revisá la duración desde la ficha de cada alimento.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
              <Link
                href="/perros/alimentos-balanceados"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-[#0048dc]"
              >
                Comprar alimento <ArrowRight size={19} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
