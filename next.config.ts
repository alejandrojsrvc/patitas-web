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

const nextConfig: NextConfig = {
  cacheComponents: true,
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
        source: "/buscar",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/perros/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=60, s-maxage=60, stale-while-revalidate=300" }],
      },
      {
        source: "/gatos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=60, s-maxage=60, stale-while-revalidate=300" }],
      },
      {
        source: "/producto/:slug",
        headers: [{ key: "Cache-Control", value: "public, max-age=60, s-maxage=60, stale-while-revalidate=300" }],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
