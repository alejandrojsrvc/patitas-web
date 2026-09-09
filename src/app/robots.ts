import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3001";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/buscar",
        "/checkout",
        "/mi-cuenta",
        "/api",
        "/*?*q=*",
        "/*?*species=*",
        "/*?*category=*",
        "/*?*brand=*",
        "/*?*lifeStage=*",
        "/*?*weightGrams=*",
        "/*?*minPrice=*",
        "/*?*maxPrice=*",
        "/*?*sort=*",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
