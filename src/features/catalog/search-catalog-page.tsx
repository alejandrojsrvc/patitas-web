"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CatalogFailure } from "@/components/catalog/catalog-failure";
import { CatalogIntro } from "@/components/catalog/catalog-intro";
import { CatalogResults } from "@/components/catalog/catalog-results";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderClient } from "@/components/layout/site-header-client";
import type { ProductFacets, ProductPage } from "@/domain/catalog/types";
import { emptyStorefrontShell } from "@/domain/storefront/types";
import { getPublicCatalog } from "@/infrastructure/api/public-catalog-browser";
import { normalizeCatalogSearchParams, productFiltersFromSearchParams, type CatalogSearchParams } from "@/lib/catalog-search-params";

type CatalogState =
  | { key: string; status: "empty" }
  | { key: string; status: "loading" }
  | { key: string; status: "success"; products: ProductPage; facets: ProductFacets | null }
  | { key: string; status: "error"; message: string };

const description = "Buscá por producto, línea o marca. También podés usar los filtros para acotar la selección.";

export function SearchCatalogPage() {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const current = useMemo(() => normalizeCatalogSearchParams(toSearchParams(searchKey)), [searchKey]);
  const filters = useMemo(() => productFiltersFromSearchParams(current), [current]);
  const query = first(current.q);
  const hasSearchQuery = Boolean(query?.trim());
  const title = query ? `Resultados para “${query}”` : "Buscar productos";
  const [state, setState] = useState<CatalogState>({
    key: searchKey,
    status: hasSearchQuery ? "loading" : "empty",
  });
  const displayedState: CatalogState =
    state.key === searchKey ? state : { key: searchKey, status: hasSearchQuery ? "loading" : "empty" };

  useEffect(() => {
    if (!hasSearchQuery) {
      setState({ key: searchKey, status: "empty" });
      return;
    }

    let active = true;

    async function loadCatalog() {
      try {
        const [products, facets] = await getPublicCatalog(filters);
        if (active) setState({ key: searchKey, status: "success", products, facets });
      } catch (cause: unknown) {
        if (!active) return;
        setState({
          key: searchKey,
          status: "error",
          message: cause instanceof Error ? cause.message : "No pudimos consultar el catálogo.",
        });
      }
    }

    void loadCatalog();

    return () => {
      active = false;
    };
  }, [filters, hasSearchQuery, searchKey]);

  return (
    <>
      <SiteHeaderClient shell={emptyStorefrontShell} searchQuery={query} />
      {displayedState.status === "empty" ? (
        <SearchEmptyState />
      ) : displayedState.status === "loading" ? (
        <SearchCatalogLoading title={title} />
      ) : displayedState.status === "success" ? (
        <CatalogResults
          result={displayedState.products}
          facets={displayedState.facets}
          title={title}
          description={description}
          current={current}
          pathname="/buscar"
        />
      ) : (
        <CatalogFailure title={title} message={displayedState.message} />
      )}
      <SiteFooter />
    </>
  );
}

function SearchEmptyState() {
  return (
    <main id="contenido" className="bg-catalog-page pb-20 [overflow-anchor:none]">
      <CatalogIntro
        title="Buscar productos"
        description="Escribí el nombre de un producto, una marca o una presentación para empezar."
      />
      <section className="container-shell pb-16 pt-6 sm:pb-20 sm:pt-8">
        <div className="max-w-xl rounded-xl bg-soft-yellow p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-ink">¿Qué estás buscando?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Usá el buscador de arriba y te mostramos solamente los productos que coinciden.
          </p>
        </div>
      </section>
    </main>
  );
}

function SearchCatalogLoading({ title }: { title: string }) {
  return (
    <main id="contenido" className="bg-catalog-page pb-20 [overflow-anchor:none]" aria-busy="true" aria-label="Cargando catálogo">
      <CatalogIntro title={title} description={description} />
      <section className="container-shell pb-10 pt-3 sm:pt-4">
        <div className="mb-4 h-14 animate-pulse border-y border-catalog-line lg:hidden" />
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <div className="hidden h-80 animate-pulse border-y border-catalog-line lg:block" />
          <div>
            <div className="mb-4 h-16 animate-pulse rounded-xl bg-soft-blue" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="aspect-[0.62] animate-pulse rounded-xl bg-white" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function toSearchParams(search: string): CatalogSearchParams {
  const params = new URLSearchParams(search);
  const result: CatalogSearchParams = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

const first = (input: string | string[] | undefined) => (Array.isArray(input) ? input[0] : input);
