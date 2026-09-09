import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";

import { ProductScreen } from "@/features/catalog/product-screen";
import { getProduct, PatitasApiError } from "@/infrastructure/api/patitas-api";
import { productDisplayName, productSeoTitle } from "@/lib/product-seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await getProduct((await params).slug);
    const displayName = productDisplayName(product);
    return {
      title: productSeoTitle(product),
      description: product.description ?? `Comprá ${displayName} y compará sus presentaciones disponibles.`,
      alternates: { canonical: `/producto/${product.slug}` },
      openGraph: { images: product.media[0]?.url ? [product.media[0].url] : undefined },
    };
  } catch (error) {
    unstable_rethrow(error);
    return {};
  }
}

export default async function ProductPage({ params }: Props) {
  const requestedSlug = (await params).slug;
  return <ProductPageContent slug={requestedSlug} />;
}

async function ProductPageContent({ slug }: { slug: string }) {
  let product;
  try {
    product = await getProduct(slug);
  } catch (error) {
    if (error instanceof PatitasApiError && error.status === 404) notFound();
    throw error;
  }

  return <ProductScreen product={product} />;
}
