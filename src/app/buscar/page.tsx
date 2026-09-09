import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogLoading } from "@/components/catalog/catalog-loading";
import { SearchCatalogPage } from "@/features/catalog/search-catalog-page";

export const metadata: Metadata = { title: "Buscar productos | Patitas Inquietas", robots: { index: false, follow: false } };
export default function SearchPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <SearchCatalogPage />
    </Suspense>
  );
}
