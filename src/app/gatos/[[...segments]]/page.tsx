import type { Metadata } from "next";

import { CatalogLandingPage, catalogLandingMetadata } from "@/features/catalog/catalog-landing-page";
import type { CatalogSearchParams } from "@/lib/catalog-search-params";

type Props = { params: Promise<{ segments?: string[] }>; searchParams: Promise<CatalogSearchParams> };

const pathFor = (segments: string[] = []) => `/gatos${segments.length ? `/${segments.join("/")}` : ""}`;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  return catalogLandingMetadata(pathFor((await params).segments), await searchParams);
}

export default async function CatsCatalogPage({ params, searchParams }: Props) {
  return <CatalogLandingPage path={pathFor((await params).segments)} searchParams={await searchParams} />;
}
