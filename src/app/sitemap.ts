import type { MetadataRoute } from "next";
import { indexableCatalogRoutes, catalogPath } from "@/data/catalog-routes";
import { guides } from "@/data/guides";
import { getBrands, getCatalogFilterProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3001");
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands, routeAvailability] = await Promise.all([
    safeCatalogCall(() => getCatalogFilterProducts()),
    safeCatalogCall(() => getBrands()),
    Promise.all(indexableCatalogRoutes.map(async (route) => ({ route, result: await safeCatalogCall(() => getCatalogFilterProducts({ species: route.species, category: route.category })) }))),
  ]);
  const fixed = ["", "/marcas", "/reponer", "/calculadora-alimento", "/guias", "/preguntas-frecuentes", "/envios", "/contacto"];
  return [
    ...fixed.map((path, index) => ({ url: `${siteUrl}${path}`, changeFrequency: index === 0 ? "daily" as const : "weekly" as const, priority: index === 0 ? 1 : 0.7 })),
    ...routeAvailability.filter(({ result }) => result.ok && result.data.length > 0).map(({ route }) => ({ url: `${siteUrl}${catalogPath(route.species, route.segments)}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...(brands.ok ? brands.data.map((brand) => ({ url: `${siteUrl}/marcas/${brand.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })) : []),
    ...(products.ok ? products.data.map((product) => ({ url: `${siteUrl}/producto/${product.slug}`, changeFrequency: "daily" as const, priority: 0.8 })) : []),
    ...Object.keys(guides).map((slug) => ({ url: `${siteUrl}/guias/${slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
