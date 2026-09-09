"use client";

import { CaretDown, Check, Funnel, X } from "@phosphor-icons/react/ssr";
import Form from "next/form";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { categoryPathForSpecies } from "@/data/catalog-routes";
import { catalogHref, type CatalogSearchParams } from "@/lib/catalog-search-params";
import { CatalogSortOptions } from "./catalog-sort-options";

export function CatalogFilterSidebar({
  pathname,
  current,
  species,
  resultCount,
  categories,
  brands,
  stages,
  weights,
}: {
  pathname: string;
  current: CatalogSearchParams;
  species?: "dog" | "cat";
  resultCount: number;
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
    drawerRef.current?.focus({ preventScroll: true });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), summary"),
      );
      if (!focusable.length) return;
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus({ preventScroll: true });
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
    triggerRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <div className="mb-1 flex min-h-14 items-center justify-between gap-3 border-y border-catalog-line py-2 lg:hidden">
        <p className="text-sm text-muted">
          <strong className="font-semibold text-ink">{resultCount}</strong> {resultCount === 1 ? "producto" : "productos"}
        </p>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-controls="catalog-filter-drawer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition-colors hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <span className="inline-flex items-center gap-2">
            <Funnel size={18} weight="bold" aria-hidden="true" />
            Filtros
          </span>
          {activeFilterCount ? (
            <span className="rounded-full bg-brand-blue px-2 py-0.5 text-xs font-bold text-white">{activeFilterCount}</span>
          ) : null}
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-ink/35 motion-safe:animate-[catalog-overlay-in_160ms_ease-out] lg:hidden"
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
          className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-16px_44px_rgba(23,23,23,0.16)] motion-safe:animate-[catalog-drawer-in_180ms_ease-out] lg:hidden"
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

      <aside className="hidden self-start pr-2 lg:block" aria-label="Filtros del catálogo">
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
  const [priceError, setPriceError] = useState<string | null>(null);

  function validatePriceRange(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const minPrice = Number(data.get("minPrice") || 0);
    const rawMaxPrice = data.get("maxPrice");
    const maxPrice = rawMaxPrice ? Number(rawMaxPrice) : null;
    if (maxPrice !== null && minPrice > maxPrice) {
      event.preventDefault();
      setPriceError("El precio máximo debe ser mayor o igual al mínimo.");
      return;
    }
    setPriceError(null);
    onNavigate?.();
  }

  return (
    <div>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-catalog-line pb-3">
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
          <Link href={pathname} prefetch={false} scroll={false} className="text-xs font-semibold text-brand-blue hover:underline">
            Limpiar
          </Link>
        )}
      </div>
      <div className="grid gap-3 border-b border-catalog-line py-4 lg:hidden">
        <CatalogSortOptions current={current} pathname={pathname} />
        <Link
          href={pathname}
          prefetch={false}
          scroll={false}
          onClick={onNavigate}
          className="text-xs font-semibold text-brand-blue hover:underline"
        >
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
            categorySpecies={species ?? (selectedSpecies === "dog" || selectedSpecies === "cat" ? selectedSpecies : undefined)}
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
          label="Peso o tamaño"
          name="weightGrams"
          values={selectedWeights}
          multiple
          options={weights}
          current={current}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <Form action={pathname} scroll={false} onSubmit={validatePriceRange} className="border-b border-catalog-line py-3">
          <PreservedSearchParams current={current} omit={["minPrice", "maxPrice", "page"]} />
          <details open={Boolean(selectedMinPrice || selectedMaxPrice)} className="group">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 font-semibold marker:content-none">
              <span>Precio</span>
              <span className="inline-flex items-center gap-1 text-xs font-normal text-muted">
                <span className="group-open:hidden">Ver</span>
                <span className="hidden group-open:inline">Ocultar</span>
                <CaretDown size={14} aria-hidden="true" className="transition-transform group-open:rotate-180" />
              </span>
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
            {priceError ? (
              <p role="alert" className="mb-2 text-sm text-[#8d2020]">
                {priceError}
              </p>
            ) : null}
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
  categorySpecies,
  current,
  pathname,
  onNavigate,
}: {
  label: string;
  name: string;
  values: string[];
  multiple?: boolean;
  options: Array<readonly [string, string]>;
  categorySpecies?: "dog" | "cat";
  current: CatalogSearchParams;
  pathname: string;
  onNavigate?: () => void;
}) {
  const selectedCount = selectedValues.length;
  const expandedByDefault = label === "Especie" || label === "Categoría" || selectedCount > 0;

  return (
    <fieldset className="border-b border-catalog-line">
      <legend className="sr-only">{label}</legend>
      <details open={expandedByDefault} className="group py-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold marker:content-none">
          <span>{label}</span>
          <span className="inline-flex items-center gap-2 text-xs font-normal text-muted">
            {selectedCount ? `${selectedCount} ${selectedCount === 1 ? "elegido" : "elegidos"}` : "Ver"}
            <CaretDown size={14} aria-hidden="true" className="transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="grid max-h-64 gap-1 overflow-y-auto pb-2 pr-1">
          {options.map(([optionValue, optionLabel]) => {
            const selected = selectedValues.includes(optionValue);
            const nextValues = multiple
              ? selected
                ? selectedValues.filter((value) => value !== optionValue)
                : [...selectedValues, optionValue]
              : selected
                ? []
                : [optionValue];
            const canonicalCategoryPath =
              pathname !== "/buscar" && name === "category" && categorySpecies
                ? categoryPathForSpecies(categorySpecies, optionValue)
                : null;
            return (
              <FilterOption
                key={optionValue}
                label={optionLabel}
                selected={selected}
                href={canonicalCategoryPath ?? catalogHref(pathname, current, { [name]: nextValues, page: 1 })}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      </details>
    </fieldset>
  );
}

function FilterOption({ label, selected, href, onNavigate }: { label: string; selected: boolean; href: string; onNavigate?: () => void }) {
  const isFilteredUrl = href.includes("?");

  return (
    <Link
      href={href}
      prefetch={false}
      rel={isFilteredUrl ? "nofollow" : undefined}
      scroll={false}
      onClick={onNavigate}
      aria-label={selected ? `${label}, seleccionado` : label}
      className={`flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm transition-colors ${selected ? "bg-soft-blue font-semibold text-brand-blue" : "text-muted hover:bg-white hover:text-ink"}`}
    >
      <span>{label}</span>
      {selected ? <Check size={15} weight="bold" aria-hidden="true" /> : null}
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
