import { Check } from "@phosphor-icons/react/ssr";
import Form from "next/form";
import Link from "next/link";

import { catalogHref, type CatalogSearchParams } from "@/lib/catalog-search-params";

export function CatalogFilterSidebar({
  pathname,
  current,
  species,
  categories,
  brands,
  stages,
  weights,
}: {
  pathname: string;
  current: CatalogSearchParams;
  species?: "dog" | "cat";
  categories: Array<readonly [string, string]>;
  brands: Array<readonly [string, string]>;
  stages: Array<readonly [string, string]>;
  weights: Array<readonly [string, string]>;
}) {
  const selectedSpecies = first(current.species);
  const selectedBrands = values(current.brand);
  const selectedStages = values(current.lifeStage);
  const selectedWeights = values(current.weightGrams);
  const selectedCategory = first(current.category);
  const selectedMinPrice = first(current.minPrice);
  const selectedMaxPrice = first(current.maxPrice);

  return (
    <aside className="self-start" aria-label="Filtros del catálogo">
      <details open className="group rounded-xl bg-catalog-soft">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold marker:content-none lg:hidden">
          <span>Filtros</span>
          <span className="text-xs font-normal text-muted">Mostrar / ocultar</span>
        </summary>
        <div className="p-4 pt-0 lg:p-5">
          <div className="hidden items-center justify-between gap-3 pb-4 lg:flex">
            <h2 className="font-display text-xl font-semibold">Filtros</h2>
            <Link href={pathname} scroll={false} className="text-xs font-semibold text-brand-blue hover:underline">
              Limpiar
            </Link>
          </div>
          <div className="flex items-center justify-end pb-3 lg:hidden">
            <Link href={pathname} scroll={false} className="text-xs font-semibold text-brand-blue hover:underline">
              Limpiar filtros
            </Link>
          </div>
          <div>
            {!species ? (
              <FilterOptionList
                label="Especie"
                name="species"
                values={selectedSpecies ? [selectedSpecies] : []}
                options={[
                  ["dog", "Perros"],
                  ["cat", "Gatos"],
                ]}
                current={current}
                pathname={pathname}
              />
            ) : null}
            {categories.length ? (
              <FilterOptionList
                label="Categoría"
                name="category"
                values={selectedCategory ? [selectedCategory] : []}
                options={categories}
                current={current}
                pathname={pathname}
              />
            ) : null}
            <FilterOptionList
              label="Marca"
              name="brand"
              values={selectedBrands}
              multiple
              options={brands}
              current={current}
              pathname={pathname}
            />
            <FilterOptionList
              label="Etapa"
              name="lifeStage"
              values={selectedStages}
              multiple
              options={stages}
              current={current}
              pathname={pathname}
            />
            <FilterOptionList
              label="Presentación"
              name="weightGrams"
              values={selectedWeights}
              multiple
              options={weights}
              current={current}
              pathname={pathname}
            />
            <Form action={pathname} scroll={false} className="pt-4">
              <PreservedSearchParams current={current} omit={["minPrice", "maxPrice", "page"]} />
              <details open={Boolean(selectedMinPrice || selectedMaxPrice)} className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold marker:content-none">
                  Precio <span className="text-xs font-normal text-muted">Abrir</span>
                </summary>
                <div className="grid gap-2 pb-3">
                  <label className="text-xs font-semibold text-muted">
                    Desde
                    <input
                      name="minPrice"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      defaultValue={selectedMinPrice}
                      placeholder="$ 0"
                      className="mt-1 h-11 w-full rounded-xl border border-catalog-line bg-catalog-canvas px-3 text-sm text-ink outline-none focus:border-brand-blue"
                    />
                  </label>
                  <label className="text-xs font-semibold text-muted">
                    Hasta
                    <input
                      name="maxPrice"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      defaultValue={selectedMaxPrice}
                      placeholder="Sin máximo"
                      className="mt-1 h-11 w-full rounded-xl border border-catalog-line bg-catalog-canvas px-3 text-sm text-ink outline-none focus:border-brand-blue"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-[#0048dc]"
                >
                  Aplicar rango
                </button>
              </details>
            </Form>
          </div>
        </div>
      </details>
    </aside>
  );
}

function FilterOptionList({
  label,
  name,
  values: selectedValues,
  multiple = false,
  options,
  current,
  pathname,
}: {
  label: string;
  name: string;
  values: string[];
  multiple?: boolean;
  options: Array<readonly [string, string]>;
  current: CatalogSearchParams;
  pathname: string;
}) {
  return (
    <fieldset className="py-4">
      <legend className="font-display text-[1.05rem] font-semibold">{label}</legend>
      <div className="mt-2 grid gap-1">
        {options.map(([optionValue, optionLabel]) => {
          const selected = selectedValues.includes(optionValue);
          const nextValues = multiple
            ? selected
              ? selectedValues.filter((value) => value !== optionValue)
              : [...selectedValues, optionValue]
            : [optionValue];
          return (
            <FilterOption
              key={optionValue}
              label={optionLabel}
              selected={selected}
              href={catalogHref(pathname, current, { [name]: nextValues, page: 1 })}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterOption({ label, selected, href }: { label: string; selected: boolean; href: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      role="checkbox"
      aria-checked={selected}
      aria-current={selected ? "page" : undefined}
      className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm transition-colors ${selected ? "bg-white font-semibold text-brand-blue" : "text-muted hover:bg-white/70 hover:text-ink"}`}
    >
      <span
        aria-hidden="true"
        className={`flex size-4 shrink-0 items-center justify-center rounded border ${selected ? "border-brand-blue bg-brand-blue text-white" : "border-catalog-line bg-white"}`}
      >
        {selected ? <Check size={11} weight="bold" /> : null}
      </span>
      {label}
    </Link>
  );
}

function PreservedSearchParams({ current, omit }: { current: CatalogSearchParams; omit: string[] }) {
  return (
    <>
      {Object.entries(current).flatMap(([key, rawValue]) => {
        if (omit.includes(key)) return [];
        const values = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
        return values.map((value, index) => <input key={`${key}-${index}-${value}`} type="hidden" name={key} value={value} />);
      })}
    </>
  );
}

const first = (input: string | string[] | undefined) => (Array.isArray(input) ? input[0] : input);
const values = (input: string | string[] | number[] | undefined) =>
  Array.isArray(input) ? input.map(String) : input ? [String(input)] : [];
