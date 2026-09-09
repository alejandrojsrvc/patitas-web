import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/json-ld";
import { CartProvider } from "@/features/cart/cart-context";
import { SessionShellProvider } from "@/features/session/session-shell-context";
import { PetShoppingProvider } from "@/features/pets/pet-shopping-context";
import "./globals.css";

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3001";

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
  title: "Patitas Inquietas | Pet shop online en CABA",
  description: "Comprá alimento balanceado, arena y esenciales para perros y gatos en CABA.",
  applicationName: "Patitas Inquietas",
  keywords: ["abastecimiento para mascotas", "alimento para perros", "alimento para gatos", "pet shop online CABA"],
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Patitas Inquietas | Pet shop online en CABA",
    description: "Alimento balanceado, arena y esenciales para perros y gatos.",
    type: "website",
    locale: "es_AR",
    siteName: "Patitas Inquietas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Patitas Inquietas | Pet shop online en CABA",
    description: "Alimento balanceado, arena y esenciales para perros y gatos.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f9fc",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={snPro.variable}>
      <body>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <CartProvider>
          <SessionShellProvider>
            <PetShoppingProvider>{children}</PetShoppingProvider>
          </SessionShellProvider>
        </CartProvider>
        <Analytics />
      </body>
      {googleAnalyticsId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} strategy="lazyOnload" />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}');
            `}
          </Script>
        </>
      ) : null}
    </html>
  );
}
