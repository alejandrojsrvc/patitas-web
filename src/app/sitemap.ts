import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { indexableCatalogRoutes, catalogPath } from "@/data/catalog-routes";
import { guides } from "@/data/guides";
import { getBrands, getSitemapProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3001");
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [products, brands] = await Promise.all([safeCatalogCall(() => getSitemapProducts()), safeCatalogCall(() => getBrands())]);
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
    ...indexableCatalogRoutes.map((route) => ({
      url: `${siteUrl}${catalogPath(route.species, route.segments)}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...(brands.ok
      ? brands.data.map((brand) => ({ url: `${siteUrl}/marcas/${brand.slug}`, changeFrequency: "weekly" as const, priority: 0.7 }))
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
