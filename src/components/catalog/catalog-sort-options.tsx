"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { catalogHref, type CatalogNavigation, type CatalogSearchParams } from "@/lib/catalog-search-params";

const options = [
  ["featured", "Destacados"],
  ["name_asc", "Nombre"],
  ["price_asc", "Menor precio"],
  ["price_desc", "Mayor precio"],
] as const;

export function CatalogSortOptions({
  current,
  pathname,
  navigation,
}: {
  current: CatalogSearchParams;
  pathname: string;
  navigation?: CatalogNavigation;
}) {
  const router = useRouter();
  const selected = first(current.sort) ?? "featured";
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex min-w-0 items-center justify-between gap-2 text-sm font-semibold text-ink">
      <span className="shrink-0">{isPending ? "Ordenando…" : "Ordenar por"}</span>
      <select
        aria-label="Ordenar productos"
        aria-busy={isPending}
        disabled={isPending}
        value={selected}
        onChange={(event) =>
          startTransition(() => {
            router.push(catalogHref(pathname, current, { sort: event.target.value, page: 1 }, navigation), { scroll: false });
          })
        }
        className="h-10 min-w-0 max-w-44 rounded-lg border border-catalog-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-brand-blue"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

const first = (input: string | string[] | undefined) => (Array.isArray(input) ? input[0] : input);
