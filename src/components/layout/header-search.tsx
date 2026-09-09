"use client";

import { CircleNotch, MagnifyingGlass } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
} from "react";

import { ProductImage } from "@/components/catalog/product-image";
import type { ProductAutocompleteItem, ProductAutocompleteResponse } from "@/domain/catalog/types";
import { getPublicProductAutocomplete } from "@/infrastructure/api/public-catalog-browser";
import { formatMoney } from "@/lib/catalog-formatters";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 180;
const AUTOCOMPLETE_CACHE_LIMIT = 20;
const SUGGESTION_ROW_HEIGHT = 72;
const LOADING_ROW_COUNT = 4;
const SUGGESTION_VERTICAL_PADDING = 8;
const autocompleteCache = new Map<string, ProductAutocompleteItem[]>();
const autocompleteInFlight = new Map<string, Promise<ProductAutocompleteItem[]>>();

type HeaderSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
  items: ProductAutocompleteItem[];
  status: "idle" | "loading" | "success" | "error";
  activeIndex: number | null;
  setActiveIndex: Dispatch<SetStateAction<number | null>>;
};

const HeaderSearchContext = createContext<HeaderSearchContextValue | null>(null);

export function HeaderSearchProvider({ initialQuery = "", children }: { initialQuery?: string; children: ReactNode }) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<ProductAutocompleteItem[]>([]);
  const [status, setStatus] = useState<HeaderSearchContextValue["status"]>(
    initialQuery.trim().length >= MIN_QUERY_LENGTH ? "loading" : "idle",
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const trimmedQuery = query.trim();

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    if (nextQuery.trim().length < MIN_QUERY_LENGTH) {
      setItems([]);
      setStatus("idle");
      setActiveIndex(null);
    } else {
      setStatus("loading");
    }
  };

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const nextItems = await getAutocompleteItems(trimmedQuery);
        if (!active) return;
        setItems(nextItems);
        setStatus("success");
      } catch {
        if (!active) return;
        setItems([]);
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [trimmedQuery]);

  return (
    <HeaderSearchContext.Provider value={{ query, setQuery: updateQuery, items, status, activeIndex, setActiveIndex }}>
      {children}
    </HeaderSearchContext.Provider>
  );
}

function useHeaderSearch() {
  const context = useContext(HeaderSearchContext);
  if (!context) throw new Error("HeaderSearch debe usarse dentro de HeaderSearchProvider.");
  return context;
}

export function HeaderSearch({ id, mobile = false, className = "" }: { id: string; mobile?: boolean; className?: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLFormElement>(null);
  const search = useHeaderSearch();
  const query = search.query;
  const items = search.items;
  const status = search.status;
  const [isOpen, setIsOpen] = useState(false);
  const activeIndex = search.activeIndex;
  const trimmedQuery = query.trim();
  const listboxId = `${id}-suggestions`;
  const activeItem = activeIndex === null ? null : (items[activeIndex] ?? null);
  const showSuggestions = isOpen && trimmedQuery.length >= MIN_QUERY_LENGTH;
  const suggestionRowCount = items.length || (status === "loading" ? LOADING_ROW_COUNT : 0);
  const suggestionPanelHeight = suggestionRowCount ? suggestionRowCount * SUGGESTION_ROW_HEIGHT + SUGGESTION_VERTICAL_PADDING : undefined;

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isOpen]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsOpen(false);
    search.setActiveIndex(null);

    if (showSuggestions && activeItem) {
      router.push(productHref(activeItem));
      return;
    }

    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    const queryString = params.toString();
    router.push(queryString ? `/buscar?${queryString}` : "/buscar", { scroll: false });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      search.setActiveIndex(null);
      return;
    }
    if (!items.length || !showSuggestions) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      search.setActiveIndex((current) => (current === null ? 0 : Math.min(current + 1, items.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      search.setActiveIndex((current) => (current === null ? items.length - 1 : Math.max(current - 1, 0)));
    }
  }

  return (
    <form ref={containerRef} action="/buscar" className={`relative ${className}`} onSubmit={submitSearch}>
      <label htmlFor={id} className="sr-only">
        Buscar productos
      </label>
      <div className="relative">
        <MagnifyingGlass
          size={mobile ? 19 : 18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-blue"
          aria-hidden="true"
        />
        <input
          id={id}
          name="q"
          type="search"
          maxLength={80}
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            const nextTrimmedQuery = nextQuery.trim();
            search.setQuery(nextQuery);
            search.setActiveIndex(null);
            if (nextTrimmedQuery.length < MIN_QUERY_LENGTH) {
              setIsOpen(false);
            } else {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (trimmedQuery.length >= MIN_QUERY_LENGTH) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar alimento, marca o producto"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? listboxId : undefined}
          aria-activedescendant={showSuggestions && activeItem ? `${listboxId}-option-${activeIndex}` : undefined}
          className="h-12 w-full rounded-xl bg-white pl-11 pr-4 text-sm text-ink placeholder:text-muted outline-none transition-shadow focus:ring-2 focus:ring-brand-yellow"
        />
      </div>

      {showSuggestions ? (
        <div
          style={suggestionPanelHeight ? { height: `${suggestionPanelHeight}px` } : undefined}
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[calc(100svh-12rem)] overflow-hidden rounded-xl bg-white text-ink shadow-[0_14px_36px_rgba(23,23,23,0.18)] ring-1 ring-black/5 transition-[height] duration-200 ease-out"
        >
          {status === "loading" && !items.length ? (
            <LoadingSuggestions />
          ) : status === "error" ? (
            <div className="px-4 py-4 text-sm text-muted" role="alert">
              No pudimos mostrar sugerencias. Podés buscar igual.
            </div>
          ) : items.length ? (
            <div className="relative h-full">
              {status === "loading" ? (
                <div
                  role="status"
                  className="absolute right-3 top-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-muted shadow-sm"
                >
                  <CircleNotch size={14} className="animate-spin text-brand-blue" aria-hidden="true" />
                  <span>Actualizando</span>
                </div>
              ) : null}
              <div id={listboxId} role="listbox" aria-label="Sugerencias de productos" aria-busy={status === "loading"} className="h-full">
                <ul className={`h-full overflow-y-auto py-1 transition-opacity duration-150 ${status === "loading" ? "opacity-60" : ""}`}>
                  {items.map((item, index) => (
                    <li key={item.id}>
                      <Link
                        id={`${listboxId}-option-${index}`}
                        href={productHref(item)}
                        prefetch={false}
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseEnter={() => search.setActiveIndex(index)}
                        onClick={() => setIsOpen(false)}
                        className={`flex min-h-[4.5rem] items-center gap-3 px-3 py-2.5 transition-colors ${index === activeIndex ? "bg-soft-blue" : "hover:bg-catalog-soft"}`}
                      >
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-catalog-soft">
                          <ProductImage
                            src={item.image?.url}
                            alt={item.image?.altText ?? item.displayName}
                            preset="thumbnail"
                            sizes="48px"
                            className="p-1"
                          />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
                            {item.brand.name}
                          </span>
                          <span className="mt-0.5 block truncate text-sm font-semibold leading-5 text-ink">{item.displayName}</span>
                        </span>
                        <span className="shrink-0 text-right font-display text-sm font-semibold tabular-nums text-ink">
                          {formatMoney(item.salePrice, item.currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="px-4 py-4" role="status">
              <p className="text-sm font-semibold text-ink">No encontramos coincidencias</p>
              <p className="mt-1 text-xs leading-5 text-muted">Probá con otra marca, producto o presentación.</p>
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}

function LoadingSuggestions() {
  return (
    <div role="status" className="relative h-full animate-pulse py-1">
      <div className="absolute right-3 top-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-muted shadow-sm">
        <CircleNotch size={14} className="animate-spin text-brand-blue" aria-hidden="true" />
        <span>Buscando</span>
      </div>
      <span className="sr-only">Buscando productos…</span>
      {Array.from({ length: LOADING_ROW_COUNT }, (_, index) => (
        <div key={index} className="flex min-h-[4.5rem] items-center gap-3 px-3 py-2.5" aria-hidden="true">
          <span className="size-12 shrink-0 rounded-lg bg-catalog-soft" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-2.5 w-1/4 rounded-full bg-catalog-soft" />
            <span className="block h-3.5 w-4/5 rounded-full bg-catalog-soft" />
          </span>
          <span className="h-3.5 w-16 shrink-0 rounded-full bg-catalog-soft" />
        </div>
      ))}
    </div>
  );
}

async function getAutocompleteItems(query: string) {
  const cached = autocompleteCache.get(query);
  if (cached) return cached;

  let pending = autocompleteInFlight.get(query);
  if (!pending) {
    pending = getPublicProductAutocomplete(query)
      .then((payload: unknown) => {
        const items = isAutocompleteResponse(payload) ? payload.items.slice(0, 8) : [];
        autocompleteCache.set(query, items);
        if (autocompleteCache.size > AUTOCOMPLETE_CACHE_LIMIT) {
          const oldestKey = autocompleteCache.keys().next().value;
          if (oldestKey) autocompleteCache.delete(oldestKey);
        }
        return items;
      })
      .finally(() => autocompleteInFlight.delete(query));
    autocompleteInFlight.set(query, pending);
  }
  return pending;
}

function isAutocompleteResponse(value: unknown): value is ProductAutocompleteResponse {
  return Boolean(
    value &&
    typeof value === "object" &&
    Array.isArray((value as { items?: unknown }).items) &&
    (value as { items: unknown[] }).items.every(isAutocompleteItem),
  );
}

function isAutocompleteItem(value: unknown): value is ProductAutocompleteItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ProductAutocompleteItem>;
  return (
    typeof item.id === "string" &&
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    (typeof item.presentation === "string" || item.presentation === null) &&
    typeof item.displayName === "string" &&
    isAutocompleteBrand(item.brand) &&
    (item.image === null || isAutocompleteImage(item.image)) &&
    typeof item.salePrice === "string" &&
    item.currency === "ARS"
  );
}

function isAutocompleteBrand(value: unknown): value is ProductAutocompleteItem["brand"] {
  if (!value || typeof value !== "object") return false;
  const brand = value as Partial<ProductAutocompleteItem["brand"]>;
  return typeof brand.id === "string" && typeof brand.name === "string" && typeof brand.slug === "string";
}

function isAutocompleteImage(value: unknown): value is NonNullable<ProductAutocompleteItem["image"]> {
  if (!value || typeof value !== "object") return false;
  const image = value as Partial<NonNullable<ProductAutocompleteItem["image"]>>;
  return typeof image.url === "string" && typeof image.altText === "string";
}

function productHref(item: ProductAutocompleteItem) {
  return `/producto/${encodeURIComponent(item.slug)}`;
}
