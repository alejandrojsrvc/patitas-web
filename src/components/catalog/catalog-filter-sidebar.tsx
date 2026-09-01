"use client";

import { Funnel, X } from "@phosphor-icons/react/ssr";
import Form from "next/form";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const selectedSpecies = first(current.species);
  const selectedBrands = values(current.brand);
  const selectedStages = values(current.lifeStage);
  const selectedWeights = values(current.weightGrams);
  const selectedCategory = first(current.category);
  const selectedMinPrice = first(current.minPrice);
  const selectedMaxPrice = first(current.maxPrice);
  const activeFilterCount =
    (species ? 0 : selectedSpecies ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    selectedBrands.length +
    selectedStages.length +
    selectedWeights.length +
    (selectedMinPrice || selectedMaxPrice ? 1 : 0);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closeDrawer = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <div className="sticky top-0 z-20 -mx-1 mb-3 bg-catalog-page py-2 lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-controls="catalog-filter-drawer"
          className="flex min-h-11 w-full items-center justify-between rounded-lg border border-catalog-line bg-white px-3 text-sm font-semibold text-ink shadow-[0_2px_8px_rgba(23,23,23,0.06)] transition-colors hover:border-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <span className="inline-flex items-center gap-2">
            <Funnel size={18} weight="bold" aria-hidden="true" />
            Filtros
          </span>
          {activeFilterCount ? (
            <span className="rounded-full bg-brand-blue px-2 py-0.5 text-xs font-bold text-white">{activeFilterCount}</span>
          ) : (
            <span className="text-xs font-normal text-muted">Abrir</span>
          )}
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 top-32 z-30 bg-ink/30 motion-safe:animate-[catalog-overlay-in_160ms_ease-out] lg:hidden"
          aria-hidden="true"
          onClick={closeDrawer}
        />
      ) : null}
      {isOpen ? (
        <aside
          ref={drawerRef}
          id="catalog-filter-drawer"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Filtros del catálogo"
          className="fixed bottom-0 left-0 top-32 z-40 w-[min(88vw,22rem)] overflow-y-auto overscroll-contain border-r border-catalog-line bg-catalog-soft px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[10px_0_28px_rgba(23,23,23,0.14)] motion-safe:animate-[catalog-drawer-in_180ms_ease-out] lg:hidden"
        >
          <FilterContent
            pathname={pathname}
            current={current}
            species={species}
            categories={categories}
            brands={brands}
            stages={stages}
            weights={weights}
            onNavigate={closeDrawer}
            onClose={closeDrawer}
          />
        </aside>
      ) : null}

      <aside className="hidden self-start rounded-xl bg-catalog-soft p-5 lg:block" aria-label="Filtros del catálogo">
        <FilterContent
          pathname={pathname}
          current={current}
          species={species}
          categories={categories}
          brands={brands}
          stages={stages}
          weights={weights}
        />
      </aside>
    </>
  );
}

function FilterContent({
  pathname,
  current,
  species,
  categories,
  brands,
  stages,
  weights,
  onNavigate,
  onClose,
}: {
  pathname: string;
  current: CatalogSearchParams;
  species?: "dog" | "cat";
  categories: Array<readonly [string, string]>;
  brands: Array<readonly [string, string]>;
  stages: Array<readonly [string, string]>;
  weights: Array<readonly [string, string]>;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const selectedSpecies = first(current.species);
  const selectedBrands = values(current.brand);
  const selectedStages = values(current.lifeStage);
  const selectedWeights = values(current.weightGrams);
  const selectedCategory = first(current.category);
  const selectedMinPrice = first(current.minPrice);
  const selectedMaxPrice = first(current.maxPrice);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-catalog-line pb-3">
        <h2 className="font-display text-lg font-semibold">Filtros</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="flex size-10 items-center justify-center rounded-lg text-ink hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <X size={20} weight="bold" aria-hidden="true" />
          </button>
        ) : (
          <Link href={pathname} scroll={false} className="text-xs font-semibold text-brand-blue hover:underline">
            Limpiar
          </Link>
        )}
      </div>
      <div className="flex items-center justify-end py-2 lg:hidden">
        <Link href={pathname} scroll={false} onClick={onNavigate} className="text-xs font-semibold text-brand-blue hover:underline">
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
            onNavigate={onNavigate}
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
            onNavigate={onNavigate}
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
          onNavigate={onNavigate}
        />
        <FilterOptionList
          label="Etapa"
          name="lifeStage"
          values={selectedStages}
          multiple
          options={stages}
          current={current}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <FilterOptionList
          label="Presentación"
          name="weightGrams"
          values={selectedWeights}
          multiple
          options={weights}
          current={current}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <Form action={pathname} scroll={false} onSubmit={onNavigate} className="border-t border-catalog-line pt-3">
          <PreservedSearchParams current={current} omit={["minPrice", "maxPrice", "page"]} />
          <details open={Boolean(selectedMinPrice || selectedMaxPrice)} className="group">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 font-semibold marker:content-none">
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
                  className="mt-1 h-10 w-full rounded-lg border border-catalog-line bg-catalog-canvas px-3 text-sm text-ink outline-none focus:border-brand-blue"
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
                  className="mt-1 h-10 w-full rounded-lg border border-catalog-line bg-catalog-canvas px-3 text-sm text-ink outline-none focus:border-brand-blue"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-[#0048dc]"
            >
              Aplicar rango
            </button>
          </details>
        </Form>
      </div>
    </div>
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
  onNavigate,
}: {
  label: string;
  name: string;
  values: string[];
  multiple?: boolean;
  options: Array<readonly [string, string]>;
  current: CatalogSearchParams;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <fieldset className="border-t border-catalog-line py-3 first:border-t-0">
      <legend className="font-display text-base font-semibold">{label}</legend>
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
              onNavigate={onNavigate}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterOption({ label, selected, href, onNavigate }: { label: string; selected: boolean; href: string; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={onNavigate}
      aria-label={selected ? `${label}, seleccionado` : label}
      className={`flex min-h-9 items-center rounded-lg px-3 text-sm transition-colors ${selected ? "bg-white font-semibold text-brand-blue" : "text-muted hover:bg-white/70 hover:text-ink"}`}
    >
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
