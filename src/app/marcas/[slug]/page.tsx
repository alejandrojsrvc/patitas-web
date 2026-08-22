import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { catalogApi, getProducts, PatitasApiError } from "@/infrastructure/api/patitas-api";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { try { const brand = await catalogApi.brand((await params).slug); return { title: `${brand.name}: productos para perros y gatos | Patitas`, description: brand.seoDescription ?? brand.description ?? `Comprá productos ${brand.name} y compará presentaciones.`, alternates: { canonical: `/marcas/${brand.slug}` } }; } catch { return {}; } }
export default async function BrandPage({ params }: Props) {
  const slug = (await params).slug;
  let brand;
  try { brand = await catalogApi.brand(slug); } catch (error) { if (error instanceof PatitasApiError && error.status === 404) notFound(); throw error; }
  const products = await getProducts({ brand: [slug], perPage: 100 });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: `${brand.name}: productos para perros y gatos`, url: `${siteUrl}/marcas/${brand.slug}`, description: brand.seoDescription ?? brand.description ?? undefined },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl }, { "@type": "ListItem", position: 2, name: "Marcas", item: `${siteUrl}/marcas` }, { "@type": "ListItem", position: 3, name: brand.name, item: `${siteUrl}/marcas/${brand.slug}` }] },
      { "@type": "ItemList", itemListElement: products.items.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.name, url: `${siteUrl}/producto/${product.slug}` })) },
    ],
  };
  return <><SiteHeader /><main id="contenido"><section className="bg-soft-blue py-8 sm:py-14 lg:py-20"><div className="container-shell"><nav aria-label="Migas de pan" className="mb-5 text-xs text-muted sm:text-sm"><Link href="/" className="hover:text-brand-blue hover:underline">Inicio</Link><span aria-hidden="true"> / </span><Link href="/marcas" className="hover:text-brand-blue hover:underline">Marcas</Link><span aria-hidden="true"> / </span><span className="font-semibold text-ink" aria-current="page">{brand.name}</span></nav><h1 className="display-heading text-4xl sm:text-7xl">{brand.name}</h1><p className="mt-4 max-w-2xl text-base text-muted sm:mt-5 sm:text-lg">{brand.description ?? "Todas las presentaciones activas de la marca, con precio y disponibilidad actual."}</p></div></section><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><section className="container-shell py-7 sm:py-12"><ProductGrid products={products.items} /></section></main><SiteFooter /></>;
}
