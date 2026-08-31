import type { ProductDetail } from "@/domain/catalog/types";
import type { ProductBreadcrumbItem } from "@/lib/product-breadcrumbs";
import { productDisplayName } from "@/lib/product-seo";

export function ProductStructuredData({ product, breadcrumbs }: { product: ProductDetail; breadcrumbs: ProductBreadcrumbItem[] }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const productUrl = `${siteUrl}/producto/${product.slug}`;
  const displayName = productDisplayName(product);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: displayName,
        description:
          product.description ??
          `Conocé ${displayName}, sus presentaciones disponibles y la información necesaria para elegirlo para tu mascota.`,
        image: product.media.map((media) => media.url),
        url: productUrl,
        sku: product.variants[0]?.sku,
        category: product.category?.name,
        brand: { "@type": "Brand", name: product.brand.name, url: `${siteUrl}/marcas/${product.brand.slug}` },
        manufacturer: { "@type": "Organization", name: product.brand.name },
        mainEntityOfPage: productUrl,
        offers: product.variants.map((variant) => ({
          "@type": "Offer",
          name: variant.presentation ?? formatWeight(variant.weightGrams) ?? "Presentación",
          sku: variant.sku,
          priceCurrency: variant.currency,
          price: variant.salePrice,
          availability: schemaAvailability(variant.fulfillment.availability, variant.fulfillment.purchasable),
          url: productUrl,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: `${siteUrl}${item.href}`,
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function formatWeight(weightGrams: number | null) {
  if (!weightGrams) return null;
  return weightGrams >= 1000 ? `${weightGrams / 1000} kg` : `${weightGrams} g`;
}

function schemaAvailability(availability: string, purchasable: boolean) {
  if (!purchasable || availability === "OUT_OF_STOCK") return "https://schema.org/OutOfStock";
  if (availability === "LATER") return "https://schema.org/PreOrder";
  return "https://schema.org/InStock";
}
