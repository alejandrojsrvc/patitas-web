import type { Metadata } from "next";

import { CatalogLandingPage, catalogLandingMetadata } from "@/features/catalog/catalog-landing-page";
import type { CatalogSearchParams } from "@/lib/catalog-search-params";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  return catalogLandingMetadata(`/marcas/${(await params).slug}`, await searchParams);
}

export default async function BrandPage({ params, searchParams }: Props) {
  return <CatalogLandingPage path={`/marcas/${(await params).slug}`} searchParams={await searchParams} />;
}
