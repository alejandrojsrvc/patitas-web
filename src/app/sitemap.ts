import type { MetadataRoute } from "next";
import { guides } from "@/data/guides";
import { getCatalogLandings, getSitemapProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL no está configurada.");

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, landings] = await Promise.all([
    safeCatalogCall(() => getSitemapProducts()),
    safeCatalogCall(() => getCatalogLandings()),
  ]);
  const fixed = [
    "",
    "/pet-shop-caba",
    "/marcas",
    "/reponer",
    "/calculadora-alimento",
    "/guias",
    "/preguntas-frecuentes",
    "/envios",
    "/contacto",
  ];
  return [
    ...fixed.map((path, index) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: index === 0 ? ("daily" as const) : ("weekly" as const),
      priority: index === 0 ? 1 : 0.7,
    })),
    ...(landings.ok
      ? landings.data.items
          .filter((landing) => landing.seo.canonical !== "/marcas")
          .map((landing) => ({
            url: `${siteUrl}${landing.seo.canonical}`,
            changeFrequency: landing.landingType === "CATALOG" ? ("daily" as const) : ("weekly" as const),
            priority: landing.landingType === "CATALOG" ? 0.8 : 0.7,
          }))
      : []),
    ...(products.ok
      ? products.data.map((product) => ({
          url: `${siteUrl}/producto/${product.slug}`,
          lastModified: new Date(product.updatedAt),
          changeFrequency: "daily" as const,
          priority: 0.8,
        }))
      : []),
    ...Object.keys(guides).map((slug) => ({ url: `${siteUrl}/guias/${slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
