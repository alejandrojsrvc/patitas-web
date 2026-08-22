import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Product, ProductDetail } from "@/domain/catalog/types";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductPurchasePanel } from "@/features/catalog/product-purchase-panel";
import { ProductViewTracker } from "@/features/catalog/product-view-tracker";
import { getProduct, getProducts, PatitasApiError, safeCatalogCall } from "@/infrastructure/api/patitas-api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await getProduct((await params).slug);
    return { title: `${product.brand.name} ${product.name} | Patitas Inquietas`, description: product.description ?? `Comprá ${product.brand.name} ${product.name} y calculá cuánto debería durar.`, alternates: { canonical: `/producto/${product.slug}` }, openGraph: { images: product.media[0]?.url ? [product.media[0].url] : undefined } };
  } catch { return {}; }
}

export default async function ProductPage({ params }: Props) {
  let product;
  try { product = await getProduct((await params).slug); }
  catch (error) { if (error instanceof PatitasApiError && error.status === 404) notFound(); throw error; }
  const categorySlug = product.category?.slug;
  const relatedResults = await Promise.all([
    safeCatalogCall(() => getProducts({ brand: [product.brand.slug], perPage: 8 })),
    categorySlug ? safeCatalogCall(() => getProducts({ category: categorySlug, perPage: 8 })) : Promise.resolve(null),
  ]);
  const relatedProducts = Array.from(new Map(
    relatedResults
      .flatMap((result) => result?.ok ? result.data.items : [])
      .filter((item) => item.id !== product.id)
      .map((item) => [item.id, item]),
  ).values()).slice(0, 4);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const productUrl = `${siteUrl}/producto/${product.slug}`;
  const breadcrumbItems = productBreadcrumbs(product);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.description ?? `Conocé ${product.name} de ${product.brand.name}, sus presentaciones disponibles y la información necesaria para elegirlo para tu mascota.`,
        image: product.media.map((media) => media.url),
        url: productUrl,
        sku: product.variants[0]?.sku,
        category: product.category?.name,
        brand: { "@type": "Brand", name: product.brand.name, url: `${siteUrl}/marcas/${product.brand.slug}` },
        manufacturer: { "@type": "Organization", name: product.brand.name },
        mainEntityOfPage: productUrl,
        offers: product.variants.map((variant) => ({ "@type": "Offer", priceCurrency: variant.currency, price: variant.salePrice, availability: variant.fulfillment.purchasable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: productUrl })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.label, item: `${siteUrl}${item.href}` })),
      },
    ],
  };
  return <><SiteHeader /><main id="contenido" className="min-w-0 bg-catalog-canvas py-6 sm:py-10"><div className="container-shell"><ProductViewTracker slug={product.slug} /><ProductBreadcrumbs product={product} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><div className="mt-5 grid gap-7 lg:mt-6 lg:grid-cols-2 lg:gap-16"><ProductGallery media={product.media} productName={product.name} /><ProductPurchasePanel product={product} /></div><ProductTechnicalInfo product={product} />{relatedProducts.length ? <section className="mt-12 border-t border-catalog-line pt-8 sm:mt-16 sm:pt-10"><div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-7"><div><h2 className="font-display text-3xl font-semibold sm:text-4xl">También podés mirar</h2><p className="mt-2 text-muted">Otras opciones de la misma marca o categoría.</p></div><Link href={`/marcas/${product.brand.slug}`} className="font-semibold text-brand-blue hover:underline">Ver toda la marca →</Link></div><ProductGrid products={relatedProducts} /></section> : null}</div></main><SiteFooter /></>;
}

function ProductBreadcrumbs({ product }: { product: Product }) {
  return <nav aria-label="Migas de pan" className="no-scrollbar overflow-x-auto"><ol className="flex min-w-max items-center gap-2 text-xs text-muted sm:text-sm"><li><Link href="/" className="hover:text-brand-blue hover:underline">Inicio</Link></li><li aria-hidden="true">/</li>{product.species ? <><li><Link href={`/${product.species === "dog" ? "perros" : "gatos"}`} className="hover:text-brand-blue hover:underline">{product.species === "dog" ? "Perros" : "Gatos"}</Link></li><li aria-hidden="true">/</li></> : null}{product.category ? <><li><Link href={`/buscar?category=${encodeURIComponent(product.category.slug)}`} className="hover:text-brand-blue hover:underline">{product.category.name}</Link></li><li aria-hidden="true">/</li></> : null}<li><Link href={`/marcas/${product.brand.slug}`} className="hover:text-brand-blue hover:underline">{product.brand.name}</Link></li><li aria-hidden="true">/</li><li className="max-w-[14rem] truncate font-semibold text-ink" aria-current="page">{product.name}</li></ol></nav>;
}

function productBreadcrumbs(product: Product) {
  return [
    { label: "Inicio", href: "/" },
    ...(product.species ? [{ label: product.species === "dog" ? "Perros" : "Gatos", href: `/${product.species === "dog" ? "perros" : "gatos"}` }] : []),
    ...(product.category ? [{ label: product.category.name, href: `/buscar?category=${encodeURIComponent(product.category.slug)}` }] : []),
    { label: product.brand.name, href: `/marcas/${product.brand.slug}` },
    { label: product.name, href: `/producto/${product.slug}` },
  ];
}

function ProductTechnicalInfo({ product }: { product: ProductDetail }) {
  const technicalSheet = product.technicalSheet;
  const presentations = product.variants.map((variant) => variant.presentation ?? formatWeight(variant.weightGrams) ?? "Presentación").join(" · ");
  const skus = product.variants.map((variant) => variant.sku).join(" · ");
  const species = technicalSheet.species ?? product.species;
  const lifeStage = technicalSheet.lifeStage ?? product.lifeStage;
  const breedSize = technicalSheet.breedSize ?? product.breedSize;
  const line = technicalSheet.line ?? product.line;
  return <section className="mt-12 border-t border-catalog-line pt-8 sm:mt-16 sm:pt-10" aria-labelledby="technical-info-title"><div><h2 id="technical-info-title" className="font-display text-3xl font-semibold sm:text-4xl">Información del producto</h2><p className="mt-3 max-w-2xl text-muted">Datos de marca, fabricante, presentación y características publicados por Patitas API.</p></div><div className="mt-6 overflow-x-auto rounded-xl bg-white sm:mt-7"><table className="min-w-[30rem] w-full text-left text-sm"><tbody><TechnicalRow label="Marca / fabricante"><Link href={`/marcas/${product.brand.slug}`} className="font-semibold text-brand-blue hover:underline">{product.brand.name}</Link></TechnicalRow>{product.category ? <TechnicalRow label="Categoría"><Link href={`/buscar?category=${encodeURIComponent(product.category.slug)}`} className="font-semibold text-brand-blue hover:underline">{product.category.name}</Link></TechnicalRow> : null}{species ? <TechnicalRow label="Para"><Link href={speciesPath(species)} className="font-semibold text-brand-blue hover:underline">{species === "dog" ? "Perros" : "Gatos"}</Link></TechnicalRow> : null}{lifeStage ? <TechnicalRow label="Etapa"><Link href={stagePath(species, lifeStage)} className="font-semibold text-brand-blue hover:underline">{stageCopy(lifeStage)}</Link></TechnicalRow> : null}{breedSize ? <TechnicalRow label="Tamaño">{breedSize}</TechnicalRow> : null}{line ? <TechnicalRow label="Línea">{line}</TechnicalRow> : null}<TechnicalRow label="Presentaciones">{presentations}</TechnicalRow><TechnicalRow label="SKU">{skus}</TechnicalRow>{technicalSheet.feedingGuide ? <TechnicalRow label="Fuente del fabricante">{technicalSheet.feedingGuide.sourceUrl ? <a href={technicalSheet.feedingGuide.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-blue hover:underline">{technicalSheet.feedingGuide.sourceLabel}</a> : technicalSheet.feedingGuide.sourceLabel}</TechnicalRow> : null}</tbody></table></div></section>;
}

function TechnicalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <tr className="border-b border-catalog-line last:border-b-0"><th scope="row" className="w-2/5 px-5 py-4 text-left font-normal text-muted">{label}</th><td className="px-5 py-4 text-ink">{children}</td></tr>;
}

function stageCopy(stage: string) {
  return ({ puppy: "Cachorro", kitten: "Gatito", adult: "Adulto", senior: "Senior" } as Record<string, string>)[stage] ?? stage;
}

function speciesPath(species: "dog" | "cat") {
  return species === "dog" ? "/perros" : "/gatos";
}

function stagePath(species: "dog" | "cat" | null, stage: string) {
  const params = new URLSearchParams({ lifeStage: stage });
  return `${species ? speciesPath(species) : "/buscar"}?${params.toString()}`;
}

function formatWeight(weightGrams: number | null) {
  if (!weightGrams) return null;
  return weightGrams >= 1000 ? `${weightGrams / 1000} kg` : `${weightGrams} g`;
}
