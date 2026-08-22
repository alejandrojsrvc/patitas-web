import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/json-ld";
import { CartProvider } from "@/features/cart/cart-context";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3001";

const bricolage = localFont({
  src: [
    {
      path: "../../public/fonts/bricolage-grotesque/bricolage-grotesque-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/bricolage-grotesque/bricolage-grotesque-medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/bricolage-grotesque/bricolage-grotesque-semibold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-bricolage",
  display: "swap",
});

const snPro = localFont({
  src: [
    {
      path: "../../public/fonts/sn-pro/sn-pro-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/sn-pro/sn-pro-italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/sn-pro/sn-pro-semibold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/sn-pro/sn-pro-bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sn-pro",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Patitas Inquietas | Lo que necesita tu mascota, justo cuando toca",
  description: "Comprá alimento, arena y esenciales. Patitas calcula cuánto duran y te ayuda a reponerlos antes de que se terminen.",
  applicationName: "Patitas Inquietas",
  keywords: [
    "abastecimiento para mascotas",
    "alimento para perros",
    "alimento para gatos",
    "reposición de alimento para mascotas",
  ],
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Todo lo que consume, antes de que se termine | Patitas Inquietas",
    description: "Comprá normalmente y calculá cuándo te conviene reponer.",
    type: "website",
    locale: "es_AR",
    siteName: "Patitas Inquietas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Todo lo que consume, antes de que se termine | Patitas Inquietas",
    description: "Comprá normalmente y calculá cuándo te conviene reponer.",
  },
};

export const viewport: Viewport = {
  themeColor: "#fffdf5",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${bricolage.variable} ${snPro.variable}`}>
      <body>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
