import type { CatalogBreadcrumb } from "@/domain/catalog/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL no está configurada.");

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore"],
    name: "Patitas Inquietas",
    url: siteUrl,
    logo: `${siteUrl}/brand/patitas-logo-principal.png`,
    description: "Pet shop online de alimento balanceado, arena y esenciales para perros y gatos en CABA.",
    areaServed: [
      { "@type": "City", name: "Ciudad Autónoma de Buenos Aires", alternateName: "CABA" },
      { "@type": "Country", name: "Argentina", identifier: "AR" },
    ],
    serviceArea: { "@type": "City", name: "Ciudad Autónoma de Buenos Aires", alternateName: "CABA" },
    knowsAbout: ["alimento para perros", "alimento para gatos", "reposición de alimento para mascotas"],
    sameAs: [],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Patitas Inquietas",
    url: siteUrl,
    description: "Comprá alimento balanceado, arena y esenciales para perros y gatos en CABA.",
    inLanguage: "es-AR",
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function FAQJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function BreadcrumbJsonLd({ breadcrumbs }: { breadcrumbs: CatalogBreadcrumb[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${siteUrl}${item.href === "/" ? "" : item.href}`,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
