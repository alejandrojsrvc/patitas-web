import {
  ArrowRight,
  Calculator,
} from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FAQ } from "@/components/sections/faq";
import { PatitasIcon, type PatitasIconName } from "@/components/ui/patitas-icon";
import type { Brand } from "@/domain/catalog/types";
import { getBrands, getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";

export const metadata: Metadata = {
  title: "Pet shop online en CABA | Patitas Inquietas",
  description: "Comprá alimento balanceado, arena, snacks y esenciales para perros y gatos en CABA. Encontrá marcas y presentaciones sin vueltas.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Pet shop online en CABA | Patitas Inquietas",
    description: "Alimento balanceado, arena y esenciales para perros y gatos, con una compra simple y ayuda humana.",
    type: "website",
    locale: "es_AR",
    siteName: "Patitas Inquietas",
    images: [{
      url: "/brand/landing/hero-pets-playful-v1.png",
      width: 1774,
      height: 887,
      alt: "Un perro y un gato asomándose juntos",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pet shop online en CABA | Patitas Inquietas",
    description: "Alimento balanceado, arena y esenciales para perros y gatos en CABA.",
    images: ["/brand/landing/hero-pets-playful-v1.png"],
  },
};

const categories = [
  {
    title: "Alimento para perros",
    copy: "Seco, húmedo y presentaciones para cada etapa.",
    image: "/brand/landing/categories/dog-food.png",
    alt: "Perro junto a un plato de alimento",
    links: [["Ver alimentos", "/perros/alimentos"]],
  },
  {
    title: "Alimento para gatos",
    copy: "Opciones para gatitos, adultos y seniors.",
    image: "/brand/landing/categories/cat-food.png",
    alt: "Gato junto a un plato de alimento",
    links: [["Ver alimentos", "/gatos/alimentos"]],
  },
  {
    title: "Arena e higiene",
    copy: "Lo necesario para mantener su espacio limpio.",
    image: "/brand/landing/categories/cat-hygiene.png",
    alt: "Gato junto a una bandeja sanitaria limpia",
    links: [["Ver arena", "/gatos/arena"]],
  },
  {
    title: "Snacks y premios",
    copy: "Premios para perros y gatos, sin catálogo infinito.",
    image: "/brand/landing/categories/snacks.png",
    alt: "Perro y gato junto a snacks para mascotas",
    links: [["Para perros", "/perros/snacks"], ["Para gatos", "/gatos/snacks"]],
  },
  {
    title: "Bolsitas y esenciales",
    copy: "Lo de todos los días para paseos y rutinas.",
    image: "/brand/landing/categories/walk-essentials.png",
    alt: "Perro listo para salir de paseo",
    links: [["Ver esenciales", "/perros/bolsas"]],
  },
] as const;

const valueProps: ReadonlyArray<readonly [PatitasIconName, string, string]> = [
  ["shopping-bag", "Encontrá rápido lo de siempre", "Marca, etapa y presentación sin vueltas."],
  ["box", "Recibilo sin cargar bolsas", "Alimento y esenciales directo a tu casa en CABA."],
  ["calendar", "Calculá cuánto puede durarte", "Usamos la recomendación del fabricante cuando está disponible."],
];

const preferredBrandOrder = ["excellent", "pro plan", "old prince", "royal canin", "vital can", "dog chow", "cat chow"];

function availableBrands(brands: Brand[]): Brand[] {
  return brands.sort((left, right) => {
    const leftIndex = preferredBrandOrder.indexOf(left.name.toLocaleLowerCase("es-AR"));
    const rightIndex = preferredBrandOrder.indexOf(right.name.toLocaleLowerCase("es-AR"));
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? preferredBrandOrder.length : leftIndex) - (rightIndex === -1 ? preferredBrandOrder.length : rightIndex);
    }
    return left.name.localeCompare(right.name, "es-AR");
  }).slice(0, 8);
}

export default async function Home() {
  const [featuredResult, brandsResult] = await Promise.all([
    safeCatalogCall(() => getProducts({ featured: true, perPage: 8 })),
    safeCatalogCall(() => getBrands()),
  ]);
  const featuredProducts = featuredResult.ok && featuredResult.data.items.length
    ? featuredResult.data.items.slice(0, 8)
    : [];
  const brands = availableBrands(brandsResult.ok ? brandsResult.data : []);
  return (
    <>
      <a href="#contenido" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-brand-yellow px-4 py-3 font-semibold text-ink transition-transform focus-visible:translate-y-0">Ir al contenido</a>
      <SiteHeader />
      <main id="contenido">
        <section className="relative isolate overflow-hidden bg-[#f7f0ea]">
          <div className="container-shell relative z-10 flex py-8 sm:py-10 lg:min-h-[clamp(30rem,38vw,38rem)] lg:items-center lg:py-12">
            <div className="max-w-xl">
              <h1 className="display-heading max-w-3xl text-4xl sm:text-5xl lg:text-[4.25rem]">Que no te falte lo de siempre.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">Tu pet shop online en CABA para comprar alimento balanceado, arena y esenciales para perros y gatos.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/buscar?category=alimentos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white hover:bg-[#0048dc]">Comprar alimento <ArrowRight size={19} weight="bold" /></Link>
                <Link href="/calculadora-alimento" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 font-semibold text-ink hover:border-brand-blue"><Calculator size={19} weight="bold" /> Calcular cuánto necesita</Link>
              </div>
            </div>
          </div>
          <div className="relative aspect-[16/9] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto">
            <Image src="/brand/landing/hero-pets-playful-v1.png" alt="Un perro y un gato asomándose juntos" fill priority sizes="100vw" className="object-cover object-right lg:object-contain" />
          </div>
        </section>

        <section className="bg-white py-14 sm:py-20" aria-labelledby="categories-title">
          <div className="container-shell">
            <div className="max-w-3xl"><h2 id="categories-title" className="display-heading text-4xl sm:text-5xl">Encontrá lo que tu mascota necesita.</h2><p className="mt-4 max-w-2xl text-lg leading-7 text-muted">Alimento, arena, snacks y esenciales para perros y gatos, sin perderte entre cientos de opciones.</p></div>
            <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
              {categories.map((category, index) => (
                <article key={category.title} className={`${index === categories.length - 1 ? "col-span-2 lg:col-span-1" : ""} overflow-hidden rounded-2xl bg-catalog-canvas`}>
                  <div className="relative aspect-[2/3]">
                    <Image src={category.image} alt={category.alt} fill sizes="(min-width: 1024px) 19vw, 50vw" className="object-cover object-[center_55%]" />
                  </div>
                  <div className="p-4 sm:p-5"><h3 className="font-display text-xl font-semibold leading-6 sm:text-2xl">{category.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{category.copy}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{category.links.map(([label, href]) => <Link key={href} href={href} className="text-sm font-semibold text-brand-blue underline-offset-4 hover:underline">{label} →</Link>)}</div></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {featuredProducts.length ? (
          <section className="bg-catalog-canvas py-14 sm:py-20" aria-labelledby="featured-title">
            <div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-5"><div><h2 id="featured-title" className="display-heading text-4xl sm:text-5xl">Productos destacados.</h2><p className="mt-4 max-w-xl text-muted">Una selección corta de alimento y esenciales disponibles en el catálogo.</p></div><Link href="/buscar" className="inline-flex items-center gap-2 font-semibold text-brand-blue underline-offset-4 hover:underline">Ver todos <ArrowRight size={18} weight="bold" /></Link></div><div className="mt-9"><ProductGrid products={featuredProducts} variant="featured" /></div></div>
          </section>
        ) : null}

        {brands.length ? (
          <section className="bg-white py-14 sm:py-20" aria-labelledby="brands-title">
            <div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-5"><div><h2 id="brands-title" className="display-heading text-4xl sm:text-5xl">Las marcas que ya conocen.</h2><p className="mt-4 max-w-xl text-muted">Entrá directo a los productos publicados de cada marca.</p></div><Link href="/marcas" className="font-semibold text-brand-blue underline-offset-4 hover:underline">Ver todas las marcas →</Link></div><div className="mt-9 grid grid-cols-2 border-l border-t border-border sm:grid-cols-4">{brands.map((brand) => <Link key={brand.id} href={`/marcas/${brand.slug}`} className="group flex min-h-28 items-center justify-center border-b border-r border-border bg-white p-5 text-center hover:bg-soft-blue">{brand.logoUrl ? <Image unoptimized src={brand.logoUrl} alt={brand.name} width={180} height={64} className="max-h-12 w-auto max-w-full object-contain" /> : <span className="font-display text-xl font-semibold group-hover:text-brand-blue">{brand.name}</span>}<span className="sr-only">Ver productos {brand.name}</span></Link>)}</div></div>
          </section>
        ) : null}

        <section className="bg-cream py-14 sm:py-20" aria-labelledby="value-title">
          <div className="container-shell"><h2 id="value-title" className="display-heading max-w-2xl text-4xl sm:text-5xl">Comprar lo de siempre, más simple.</h2><div className="mt-9 grid gap-x-10 gap-y-9 border-t border-border pt-8 md:grid-cols-3">{valueProps.map(([iconName, title, text]) => <article key={title}><PatitasIcon name={iconName} className="size-9" /><h3 className="mt-6 font-display text-2xl font-semibold leading-7">{title}</h3><p className="mt-3 max-w-sm leading-6 text-muted">{text}</p></article>)}</div></div>
        </section>

        <section className="bg-brand-blue py-14 text-white sm:py-20" aria-labelledby="calculator-title">
          <div className="container-shell grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-14"><div><h2 id="calculator-title" className="display-heading max-w-3xl text-4xl sm:text-5xl">¿Cuánto alimento necesita tu mascota?</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Calculá cuánto consume y cuánto puede durarte una bolsa. Cuando está disponible, usamos la recomendación del fabricante.</p></div><Link href="/calculadora-alimento" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand-yellow px-6 font-semibold text-ink hover:bg-[#f1df00]">Probar calculadora <ArrowRight size={19} weight="bold" /></Link></div>
        </section>

        <FAQ />
      </main>
      <SiteFooter />
    </>
  );
}
