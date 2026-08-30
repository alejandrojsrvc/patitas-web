import { ArrowDown, ArrowUp, Check, Sparkle, TextAa } from "@phosphor-icons/react/ssr";
import Form from "next/form";
import Link from "next/link";

import { categorySlugsForSpecies } from "@/data/catalog-routes";
import type { Brand, Category, ProductPage, Species } from "@/domain/catalog/types";
import { formatWeight } from "@/lib/catalog-formatters";
import { catalogHref, type CatalogSearchParams } from "@/lib/catalog-search-params";
import { ProductGrid } from "./product-grid";

export function CatalogResults({
  result,
  brands,
  species,
  title,
  description,
  current,
  categories = [],
  pathname,
}: {
  result: ProductPage;
  brands: Brand[];
  species?: Species;
  title: string;
  description: string;
  current: CatalogSearchParams;
  categories?: Category[];
  pathname: string;
}) {
  const selectedBrands = values(current.brand);
  const selectedStages = values(current.lifeStage);
  const selectedWeights = values(current.weightGrams);
  const availableProducts = result.items;
  const weights = [...new Set([
    ...(result.meta.facets?.weightGrams ?? availableProducts.flatMap((product) => product.variants.map((variant) => variant.weightGrams).filter((weight): weight is number => Boolean(weight)))),
    ...selectedWeights.map(Number).filter((weight) => Number.isInteger(weight) && weight > 0),
  ])].sort((a, b) => a - b);
  const availableStages = result.meta.facets?.lifeStages ?? [...new Set(availableProducts.map((product) => product.lifeStage).filter((stage): stage is string => Boolean(stage)))];
  const stages = [...new Set([...availableStages, ...selectedStages])]
    .sort((left, right) => stageOrder.indexOf(left) - stageOrder.indexOf(right));
  const visibleBrands = brands;
  const categorySlugs = species ? categorySlugsForSpecies(species) : null;
  const flatCategories = flattenCategories(categories).filter((category) => !categorySlugs || categorySlugs.has(category.slug));

  const selectedSpecies = first(current.species);
  const selectedMinPrice = first(current.minPrice);
  const selectedMaxPrice = first(current.maxPrice);
  return (
    <main id="contenido" className="bg-catalog-page pb-20">
      <section className="border-b border-catalog-line bg-white py-5 sm:py-7">
        <div className="container-shell">
          <div className="max-w-4xl">
            {species ? <nav aria-label="Migas de pan" className="mb-3 overflow-x-auto text-xs text-muted no-scrollbar"><ol className="flex shrink-0 items-center gap-2"><li><Link href="/" className="hover:text-brand-blue hover:underline">Inicio</Link></li><li aria-hidden="true">/</li><li className="font-semibold text-ink" aria-current="page">{title}</li></ol></nav> : null}
            <h1 className="display-heading text-3xl sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p>
          </div>
        </div>
      </section>

      <section className="container-shell py-5 sm:py-7 lg:py-9">
        <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          <aside className="self-start" aria-label="Filtros del catálogo">
            <details open className="group rounded-xl bg-catalog-soft">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold marker:content-none lg:hidden">
                <span>Filtros</span>
                <span className="text-xs font-normal text-muted">Mostrar / ocultar</span>
              </summary>
              <div className="p-4 pt-0 lg:p-5">
                <div className="hidden items-center justify-between gap-3 pb-4 lg:flex">
                  <h2 className="font-display text-xl font-semibold">Filtros</h2>
                  <Link href={pathname} scroll={false} className="text-xs font-semibold text-brand-blue hover:underline">Limpiar</Link>
                </div>
                <div className="flex items-center justify-end pb-3 lg:hidden">
                  <Link href={pathname} scroll={false} className="text-xs font-semibold text-brand-blue hover:underline">Limpiar filtros</Link>
                </div>
                <div>
                  {!species ? <FilterOptionList label="Especie" name="species" values={selectedSpecies ? [selectedSpecies] : []} options={[["dog", "Perros"], ["cat", "Gatos"]]} current={current} pathname={pathname} /> : null}
                  {flatCategories.length ? <FilterOptionList label="Categoría" name="category" values={first(current.category) ? [first(current.category)!] : []} options={flatCategories.map((category) => [category.slug, category.label])} current={current} pathname={pathname} /> : null}
                  <FilterOptionList label="Marca" name="brand" values={selectedBrands} multiple options={visibleBrands.map((brand) => [brand.slug, brand.name])} current={current} pathname={pathname} />
                  <FilterOptionList label="Etapa" name="lifeStage" values={selectedStages} multiple options={stages.map((stage) => [stage, stageCopy(stage)])} current={current} pathname={pathname} />
                  <FilterOptionList label="Presentación" name="weightGrams" values={selectedWeights} multiple options={weights.map((weight) => [String(weight), formatWeight(weight) ?? String(weight)])} current={current} pathname={pathname} />
                  <Form action={pathname} scroll={false} className="pt-4">
                    <PreservedSearchParams current={current} omit={["minPrice", "maxPrice", "page"]} />
                    <details open={Boolean(selectedMinPrice || selectedMaxPrice)} className="group">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold marker:content-none">Precio <span className="text-xs font-normal text-muted">Abrir</span></summary>
                      <div className="grid gap-2 pb-3">
                        <label className="text-xs font-semibold text-muted">Desde<input name="minPrice" type="number" min="0" inputMode="numeric" defaultValue={selectedMinPrice} placeholder="$ 0" className="mt-1 h-11 w-full rounded-xl border border-catalog-line bg-catalog-canvas px-3 text-sm text-ink outline-none focus:border-brand-blue" /></label>
                        <label className="text-xs font-semibold text-muted">Hasta<input name="maxPrice" type="number" min="0" inputMode="numeric" defaultValue={selectedMaxPrice} placeholder="Sin máximo" className="mt-1 h-11 w-full rounded-xl border border-catalog-line bg-catalog-canvas px-3 text-sm text-ink outline-none focus:border-brand-blue" /></label>
                      </div>
                      <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-[#0048dc]">Aplicar rango</button>
                    </details>
                  </Form>
                </div>
              </div>
            </details>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex min-w-0 flex-col gap-3 border-b border-catalog-line pb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5">
              <div>
                <p className="text-sm text-muted"><strong className="text-ink">{result.meta.total}</strong> productos</p>
                {result.meta.totalPages > 1 ? <p className="mt-1 text-xs text-muted">Página {result.meta.page} de {result.meta.totalPages}</p> : null}
              </div>
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
                <span className="shrink-0">Ordenar</span>
                <SortOptions current={current} pathname={pathname} />
              </div>
            </div>
            <ProductGrid products={result.items} />
            {result.meta.totalPages > 1 ? <Pagination result={result} pathname={pathname} current={current} /> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function FilterOptionList({ label, name, values: selectedValues, multiple = false, options, current, pathname }: { label: string; name: string; values: string[]; multiple?: boolean; options: Array<readonly [string, string]>; current: CatalogSearchParams; pathname: string }) {
  return (
    <fieldset className="py-4">
      <legend className="font-display text-[1.05rem] font-semibold">{label}</legend>
      <div className="mt-2 grid gap-1">
        {options.map(([optionValue, optionLabel]) => {
          const selected = selectedValues.includes(optionValue);
          const nextValues = multiple ? (selected ? selectedValues.filter((value) => value !== optionValue) : [...selectedValues, optionValue]) : [optionValue];
          return <FilterOption key={optionValue} label={optionLabel} selected={selected} href={catalogHref(pathname, current, { [name]: nextValues, page: 1 })} />;
        })}
      </div>
    </fieldset>
  );
}

function FilterOption({ label, selected, href }: { label: string; selected: boolean; href: string }) {
  return <Link href={href} scroll={false} role="checkbox" aria-checked={selected} aria-current={selected ? "page" : undefined} className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm transition-colors ${selected ? "bg-white font-semibold text-brand-blue" : "text-muted hover:bg-white/70 hover:text-ink"}`}><span aria-hidden="true" className={`flex size-4 shrink-0 items-center justify-center rounded border ${selected ? "border-brand-blue bg-brand-blue text-white" : "border-catalog-line bg-white"}`}>{selected ? <Check size={11} weight="bold" /> : null}</span>{label}</Link>;
}

function SortOptions({ current, pathname }: { current: CatalogSearchParams; pathname: string }) {
  const options = [["featured", "Destacados", Sparkle], ["name_asc", "Nombre", TextAa], ["price_asc", "Menor precio", ArrowDown], ["price_desc", "Mayor precio", ArrowUp]] as const;
  const selected = first(current.sort) ?? "featured";
  return <div className="no-scrollbar flex max-w-full shrink overflow-x-auto rounded-xl bg-catalog-soft p-1" aria-label="Ordenar resultados">{options.map(([value, label, Icon]) => <Link key={value} href={catalogHref(pathname, current, { sort: value, page: 1 })} scroll={false} aria-current={selected === value ? "page" : undefined} className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs whitespace-nowrap transition-colors sm:px-3 ${selected === value ? "bg-brand-yellow font-semibold text-ink" : "text-muted hover:bg-soft-yellow hover:text-ink"}`}><Icon size={14} weight={selected === value ? "bold" : "regular"} aria-hidden="true" />{label}</Link>)}</div>;
}

function PreservedSearchParams({ current, omit }: { current: CatalogSearchParams; omit: string[] }) {
  return <>{Object.entries(current).flatMap(([key, rawValue]) => { if (omit.includes(key)) return []; const values = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []; return values.map((value, index) => <input key={`${key}-${index}-${value}`} type="hidden" name={key} value={value} />); })}</>;
}

export function Pagination({ result, pathname, current }: { result: ProductPage; pathname: string; current: CatalogSearchParams }) {
  return (
    <nav aria-label="Paginación del catálogo" className="mt-10 flex items-center justify-center gap-3">
      <Link aria-disabled={result.meta.page <= 1} tabIndex={result.meta.page <= 1 ? -1 : undefined} href={catalogHref(pathname, current, { page: Math.max(1, result.meta.page - 1) })} scroll={false} className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.meta.page <= 1 ? "pointer-events-none opacity-40" : "bg-white shadow-[0_4px_12px_rgba(24,33,43,0.05)] hover:text-brand-blue"}`}>Anterior</Link>
      <span className="px-2 text-sm text-muted">{result.meta.page} de {result.meta.totalPages}</span>
      <Link aria-disabled={result.meta.page >= result.meta.totalPages} tabIndex={result.meta.page >= result.meta.totalPages ? -1 : undefined} href={catalogHref(pathname, current, { page: Math.min(result.meta.totalPages, result.meta.page + 1) })} scroll={false} className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.meta.page >= result.meta.totalPages ? "pointer-events-none opacity-40" : "bg-white shadow-[0_4px_12px_rgba(24,33,43,0.05)] hover:text-brand-blue"}`}>Siguiente</Link>
    </nav>
  );
}

const first = (input: string | string[] | undefined) => Array.isArray(input) ? input[0] : input;
const values = (input: string | string[] | number[] | undefined) => Array.isArray(input) ? input.map(String) : input ? [String(input)] : [];

const stageOrder = ["puppy", "kitten", "adult", "senior"];
const stageCopy = (stage: string) => ({ puppy: "Cachorro", kitten: "Gatito", adult: "Adulto", senior: "Senior" } as Record<string, string>)[stage] ?? stage;

function flattenCategories(categories: Category[], depth = 0): Array<Category & { label: string }> {
  return categories.flatMap((category) => [
    { ...category, label: `${depth ? "— ".repeat(depth) : ""}${category.name}` },
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}
