import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL no está configurada.");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/buscar", "/checkout", "/carrito", "/mi-cuenta", "/pedido", "/auth", "/api", "/*?*"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
