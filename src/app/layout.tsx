import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

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
  description:
    "Configurá una vez el alimento y los esenciales de tu mascota. Patitas organiza entregas quincenales o mensuales que podés cambiar o saltar.",
  applicationName: "Patitas Inquietas",
  keywords: [
    "abastecimiento para mascotas",
    "alimento para perros",
    "alimento para gatos",
    "entrega recurrente para mascotas",
  ],
  openGraph: {
    title: "Que nunca le falte lo que necesita | Patitas Inquietas",
    description:
      "Alimento y esenciales de tu mascota, organizados según su ritmo.",
    type: "website",
    locale: "es_AR",
    siteName: "Patitas Inquietas",
  },
  twitter: {
    card: "summary_large_image",
    title: "Que nunca le falte lo que necesita | Patitas Inquietas",
    description:
      "Alimento y esenciales de tu mascota, organizados según su ritmo.",
  },
};

export const viewport: Viewport = {
  themeColor: "#fffdf5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${bricolage.variable} ${snPro.variable}`}>
      <body>{children}</body>
    </html>
  );
}
