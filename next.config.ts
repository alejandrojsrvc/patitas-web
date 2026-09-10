import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
];

const publicDocumentCacheHeaders = [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }];
const publicAssetCacheHeaders = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
const privateDocumentCacheHeaders = [{ key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" }];

const nextConfig: NextConfig = {
  images: {
    qualities: [60, 75],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/**",
      },
      {
        protocol: "https",
        hostname: "media.patitasinquietas.com.ar",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["patitasinquietas.local"],
  async headers() {
    return [
      {
        source: "/robots.txt",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/sitemap.xml",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/brand/:path*",
        headers: publicAssetCacheHeaders,
      },
      {
        source: "/",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/buscar",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          ...privateDocumentCacheHeaders,
        ],
      },
      {
        source: "/perros/:path*",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/gatos/:path*",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/marcas/:path*",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/producto/:slug",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/calculadora-alimento",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/pet-shop-caba",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/reponer",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/guias/:path*",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/:information(preguntas-frecuentes|envios|cambios-y-devoluciones|contacto|terminos|privacidad|defensa-del-consumidor|arrepentimiento)",
        headers: publicDocumentCacheHeaders,
      },
      {
        source: "/api/:path*",
        headers: privateDocumentCacheHeaders,
      },
      {
        source: "/auth/:path*",
        headers: privateDocumentCacheHeaders,
      },
      {
        source: "/mi-cuenta/:path*",
        headers: privateDocumentCacheHeaders,
      },
      {
        source: "/carrito/:path*",
        headers: privateDocumentCacheHeaders,
      },
      {
        source: "/checkout/:path*",
        headers: privateDocumentCacheHeaders,
      },
      {
        source: "/pedido/:path*",
        headers: privateDocumentCacheHeaders,
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
