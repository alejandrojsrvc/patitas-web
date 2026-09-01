import { X } from "@phosphor-icons/react/ssr";
import Link from "next/link";

import type { CatalogSearchParams } from "@/lib/catalog-search-params";
import { catalogHref } from "@/lib/catalog-search-params";

type FilterOption = readonly [string, string];

type CatalogAppliedFiltersProps = {
  pathname: string;
  current: CatalogSearchParams;
  species?: "dog" | "cat";
  categories: FilterOption[];
  brands: FilterOption[];
  stages: FilterOption[];
  weights: FilterOption[];
};

type AppliedFilter = {
  id: string;
  label: string;
  href: string;
};

export function CatalogAppliedFilters({ pathname, current, species, categories, brands, stages, weights }: CatalogAppliedFiltersProps) {
  const filters: AppliedFilter[] = [];

  if (!species) {
    const selectedSpecies = first(current.species);
    if (selectedSpecies) {
      filters.push({
        id: `species-${selectedSpecies}`,
        label: `Especie: ${selectedSpecies === "dog" ? "Perros" : selectedSpecies === "cat" ? "Gatos" : selectedSpecies}`,
        href: catalogHref(pathname, current, { species: undefined, page: 1 }),
      });
    }
  }

  addSingleFilter(filters, "category", first(current.category), categories, pathname, current);
  addMultiFilters(filters, "brand", values(current.brand), brands, pathname, current);
  addMultiFilters(filters, "lifeStage", values(current.lifeStage), stages, pathname, current);
  addMultiFilters(filters, "weightGrams", values(current.weightGrams), weights, pathname, current);

  const minPrice = first(current.minPrice);
  const maxPrice = first(current.maxPrice);
  if (minPrice || maxPrice) {
    filters.push({
      id: "price",
      label: `Precio: ${minPrice ? `$ ${minPrice}` : "$ 0"} – ${maxPrice ? `$ ${maxPrice}` : "sin máximo"}`,
      href: catalogHref(pathname, current, { minPrice: undefined, maxPrice: undefined, page: 1 }),
    });
  }

  if (!filters.length) return null;

  return (
    <section aria-label="Filtros aplicados" className="mb-5 flex flex-wrap items-center gap-2 sm:mb-6">
      <h2 className="mr-1 text-sm font-semibold text-ink">Filtros aplicados</h2>
      {filters.map((filter) => (
        <Link
          key={filter.id}
          href={filter.href}
          scroll={false}
          aria-label={`Quitar ${filter.label}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand-blue/25 bg-white px-3 pl-3 text-xs font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-soft-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <span>{filter.label}</span>
          <X size={14} weight="bold" aria-hidden="true" />
        </Link>
      ))}
      <Link href={pathname} scroll={false} className="ml-1 text-xs font-semibold text-brand-blue underline-offset-4 hover:underline">
        Limpiar todos
      </Link>
    </section>
  );
}

function addSingleFilter(
  filters: AppliedFilter[],
  name: string,
  value: string | undefined,
  options: FilterOption[],
  pathname: string,
  current: CatalogSearchParams,
) {
  if (!value) return;
  filters.push({
    id: `${name}-${value}`,
    label: `${filterName(name)}: ${optionLabel(options, value)}`,
    href: catalogHref(pathname, current, { [name]: undefined, page: 1 }),
  });
}

function addMultiFilters(
  filters: AppliedFilter[],
  name: string,
  values: string[],
  options: FilterOption[],
  pathname: string,
  current: CatalogSearchParams,
) {
  for (const value of values) {
    const remaining = values.filter((item) => item !== value);
    filters.push({
      id: `${name}-${value}`,
      label: `${filterName(name)}: ${optionLabel(options, value)}`,
      href: catalogHref(pathname, current, { [name]: remaining.length ? remaining : undefined, page: 1 }),
    });
  }
}

function optionLabel(options: FilterOption[], value: string) {
  return options.find(([optionValue]) => optionValue === value)?.[1] ?? value;
}

function filterName(name: string) {
  return name === "category" ? "Categoría" : name === "brand" ? "Marca" : name === "lifeStage" ? "Etapa" : "Presentación";
}

const first = (input: string | string[] | undefined) => (Array.isArray(input) ? input[0] : input);
const values = (input: string | string[] | number[] | undefined) =>
  Array.isArray(input) ? input.map(String) : input ? [String(input)] : [];
