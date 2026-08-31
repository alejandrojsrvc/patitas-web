import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pagination } from "@/components/catalog/catalog-results";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getBrand, getProducts, PatitasApiError } from "@/infrastructure/api/patitas-api";
import type { CatalogSearchParams } from "@/lib/catalog-search-params";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { try { const brand = await getBrand((await params).slug); return { title: `${brand.name}: productos para perros y gatos | Patitas`, description: brand.seoDescription ?? brand.description ?? `Comprá productos ${brand.name} y compará presentaciones.`, alternates: { canonical: `/marcas/${brand.slug}` } }; } catch { return {}; } }
export default async function BrandPage({ params, searchParams }: Props) {
  const slug = (await params).slug;
  const query = await searchParams;
  const parsedPage = Number(Array.isArray(query.page) ? query.page[0] : query.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const [brand, products] = await Promise.all([getBrand(slug), getProducts({ brand: [slug], page, perPage: 24 })]).catch((error: unknown) => {
    if (error instanceof PatitasApiError && error.status === 404) notFound();
    throw error;
  });
  const hasDogProducts = products.items.some((product) => product.species === "dog");
  const hasCatProducts = products.items.some((product) => product.species === "cat");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: `${brand.name}: productos para perros y gatos`, url: `${siteUrl}/marcas/${brand.slug}`, description: brand.seoDescription ?? brand.description ?? undefined },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Marcas", item: `${siteUrl}/marcas` }, { "@type": "ListItem", position: 3, name: brand.name, item: `${siteUrl}/marcas/${brand.slug}` }] },
      { "@type": "ItemList", itemListElement: products.items.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.name, url: `${siteUrl}/producto/${product.slug}` })) },
    ],
  };
  return <><SiteHeader /><main id="contenido"><section className="bg-soft-blue py-8 sm:py-14 lg:py-20"><div className="container-shell"><nav aria-label="Migas de pan" className="mb-5 text-xs text-muted sm:text-sm"><Link href="/" className="hover:text-brand-blue hover:underline">Inicio</Link><span aria-hidden="true"> / </span><Link href="/marcas" className="hover:text-brand-blue hover:underline">Marcas</Link><span aria-hidden="true"> / </span><span className="font-semibold text-ink" aria-current="page">{brand.name}</span></nav><h1 className="display-heading text-4xl sm:text-7xl">{brand.name}</h1><p className="mt-4 max-w-2xl text-base text-muted sm:mt-5 sm:text-lg">{brand.description ?? "Todas las presentaciones activas de la marca, con precio y disponibilidad actual."}</p></div></section><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><section className="container-shell py-7 sm:py-12"><ProductGrid products={products.items} />{products.meta.totalPages > 1 ? <Pagination result={products} pathname={`/marcas/${brand.slug}`} current={query} /> : null}</section>{products.items.length ? <section className="bg-cream py-12 sm:py-16"><div className="container-shell"><h2 className="display-heading max-w-2xl text-3xl sm:text-4xl">¿No sabés qué presentación elegir?</h2><p className="mt-4 max-w-2xl text-muted">Calculá cuánto puede durar una bolsa o revisá la guía según tu mascota.</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-brand-blue"><Link href="/calculadora-alimento" className="hover:underline">Probar calculadora →</Link>{hasDogProducts ? <Link href="/guias/cuanto-alimento-come-un-perro" className="hover:underline">Cuánto alimento come un perro →</Link> : null}{hasCatProducts ? <Link href="/guias/cuanto-alimento-come-un-gato" className="hover:underline">Cuánto alimento come un gato →</Link> : null}</div></div></section> : null}</main><SiteFooter /></>;
}
