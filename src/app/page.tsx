import {
  ArrowRight,
  Calculator,
  CreditCard,
  MapPin,
  Package,
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
        <section className="bg-[#f3eee7] py-4 sm:py-6 lg:py-8">
          <div className="container-shell overflow-hidden rounded-2xl bg-[#e8ded1] lg:grid lg:min-h-[28rem] lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative z-10 flex items-center px-5 py-9 sm:px-9 sm:py-12 lg:px-12 lg:py-14">
              <div className="max-w-xl">
                <h1 className="display-heading max-w-3xl text-4xl sm:text-5xl lg:text-[3.75rem]">Lo que comen, usan y disfrutan. En un solo pedido.</h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-[#52504d] sm:text-lg">Alimento, arena, snacks y esenciales para perros y gatos, con entrega en CABA.</p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href="/buscar?category=alimentos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white hover:bg-[#0048dc]">Comprar alimento <ArrowRight size={19} weight="bold" /></Link>
                  <Link href="/perros" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 font-semibold text-ink hover:text-brand-blue">Ver para perros y gatos</Link>
                </div>
              </div>
            </div>
            <div className="relative min-h-[17rem] sm:min-h-[22rem] lg:min-h-full">
              <Image src="/brand/landing/hero-petshop-clean-v1.png" alt="Perro y gato junto a alimentos y esenciales para mascotas" fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover object-[68%_center] lg:object-[64%_center]" />
            </div>
          </div>
        </section>

        <section className="border-b border-catalog-line bg-white" aria-label="Información de compra">
          <div className="container-shell grid divide-y divide-catalog-line md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="flex items-center gap-3 py-4 md:px-5 md:first:pl-0"><MapPin size={22} weight="duotone" className="shrink-0 text-brand-blue" /><p className="text-sm"><strong className="block text-ink">Entrega en CABA</strong><span className="text-muted">La opción disponible se confirma en el checkout.</span></p></div>
            <div className="flex items-center gap-3 py-4 md:px-5"><CreditCard size={22} weight="duotone" className="shrink-0 text-brand-blue" /><p className="text-sm"><strong className="block text-ink">Pago online</strong><span className="text-muted">Elegí el medio habilitado para tu compra.</span></p></div>
            <div className="flex items-center gap-3 py-4 md:px-5 md:last:pr-0"><Package size={22} weight="duotone" className="shrink-0 text-brand-blue" /><p className="text-sm"><strong className="block text-ink">Stock y precio actuales</strong><span className="text-muted">Ves sólo presentaciones publicadas.</span></p></div>
          </div>
        </section>

        <section className="bg-white py-10 sm:py-14" aria-labelledby="categories-title">
          <div className="container-shell">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="categories-title" className="display-heading text-3xl sm:text-4xl">Comprá por categoría</h2><p className="mt-2 max-w-2xl text-muted">Entrá directo a lo que necesitás.</p></div><Link href="/buscar" className="text-sm font-semibold text-brand-blue hover:underline">Ver todo el catálogo →</Link></div>
            <div className="no-scrollbar -mx-2 mt-6 flex snap-x gap-3 overflow-x-auto px-2 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
              {categories.map((category) => (
                <article key={category.title} className="group w-[14.5rem] shrink-0 snap-start overflow-hidden rounded-xl bg-catalog-soft lg:w-auto">
                  <div className="grid h-full grid-cols-[5.5rem_1fr] items-center gap-3 p-2 lg:grid-cols-1 lg:gap-0">
                    <Link href={category.links[0][1]} className="relative aspect-square overflow-hidden rounded-lg bg-[#eee9e1] lg:w-full" aria-label={category.links[0][0]}>
                      <Image src={category.image} alt={category.alt} fill sizes="(min-width: 1024px) 18vw, 88px" className="object-cover object-center" />
                    </Link>
                    <div className="py-2 pr-2 lg:p-3"><h3 className="font-display text-base font-semibold leading-5 lg:text-lg"><Link href={category.links[0][1]} className="group-hover:text-brand-blue">{category.title}</Link></h3><p className="mt-1 text-xs leading-5 text-muted">{category.copy}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{category.links.map(([label, href]) => <Link key={href} href={href} className="text-xs font-semibold text-brand-blue hover:underline">{label} →</Link>)}</div></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {featuredProducts.length ? (
          <section className="bg-catalog-canvas py-12 sm:py-16" aria-labelledby="featured-title">
            <div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-5"><div><h2 id="featured-title" className="display-heading text-4xl sm:text-5xl">Productos destacados.</h2><p className="mt-4 max-w-xl text-muted">Una selección corta de alimento y esenciales disponibles en el catálogo.</p></div><Link href="/buscar" className="inline-flex items-center gap-2 font-semibold text-brand-blue underline-offset-4 hover:underline">Ver todos <ArrowRight size={18} weight="bold" /></Link></div><div className="mt-9"><ProductGrid products={featuredProducts} variant="featured" /></div></div>
          </section>
        ) : null}

        {brands.length ? (
          <section className="bg-white py-14 sm:py-20" aria-labelledby="brands-title">
            <div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-5"><div><h2 id="brands-title" className="display-heading text-4xl sm:text-5xl">Las marcas que ya conocen.</h2><p className="mt-4 max-w-xl text-muted">Entrá directo a los productos publicados de cada marca.</p></div><Link href="/marcas" className="font-semibold text-brand-blue underline-offset-4 hover:underline">Ver todas las marcas →</Link></div><div className="mt-9 grid grid-cols-2 border-l border-t border-border sm:grid-cols-4">{brands.map((brand) => <Link key={brand.id} href={`/marcas/${brand.slug}`} className="group flex min-h-28 items-center justify-center border-b border-r border-border bg-white p-5 text-center hover:bg-soft-blue">{brand.logoUrl ? <Image unoptimized src={brand.logoUrl} alt={brand.name} width={180} height={64} className="max-h-12 w-auto max-w-full object-contain" /> : <span className="font-display text-xl font-semibold group-hover:text-brand-blue">{brand.name}</span>}<span className="sr-only">Ver productos {brand.name}</span></Link>)}</div></div>
          </section>
        ) : null}

        <section className="bg-cream py-12 sm:py-16" aria-labelledby="value-title">
          <div className="container-shell"><h2 id="value-title" className="display-heading max-w-2xl text-4xl sm:text-5xl">Comprar lo de siempre, más simple.</h2><div className="mt-9 grid gap-x-10 gap-y-9 border-t border-border pt-8 md:grid-cols-3">{valueProps.map(([iconName, title, text]) => <article key={title}><PatitasIcon name={iconName} className="size-9" /><h3 className="mt-6 font-display text-2xl font-semibold leading-7">{title}</h3><p className="mt-3 max-w-sm leading-6 text-muted">{text}</p></article>)}</div></div>
        </section>

        <section className="bg-store-navy py-12 text-white sm:py-16" aria-labelledby="calculator-title">
          <div className="container-shell grid items-center gap-8 lg:grid-cols-[auto_1fr_auto] lg:gap-10"><span className="flex size-14 items-center justify-center rounded-xl bg-white/10 text-brand-yellow"><Calculator size={28} weight="duotone" /></span><div><h2 id="calculator-title" className="display-heading max-w-3xl text-3xl sm:text-4xl">Calculá cuánto puede durar una bolsa</h2><p className="mt-3 max-w-2xl leading-7 text-white/70">Elegí alimento, presentación y peso. Te mostramos si el cálculo usa la tabla del fabricante o una estimación general.</p></div><Link href="/calculadora-alimento" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-yellow px-6 font-semibold text-ink hover:bg-[#f1df00]">Abrir calculadora <ArrowRight size={19} weight="bold" /></Link></div>
        </section>

        <FAQ />
      </main>
      <SiteFooter />
    </>
  );
}
