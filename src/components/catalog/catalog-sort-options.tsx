import { ArrowDown, ArrowUp, Sparkle, TextAa } from "@phosphor-icons/react/ssr";
import Link from "next/link";

import { catalogHref, type CatalogSearchParams } from "@/lib/catalog-search-params";

export function CatalogSortOptions({ current, pathname }: { current: CatalogSearchParams; pathname: string }) {
  const options = [
    ["featured", "Destacados", Sparkle],
    ["name_asc", "Nombre", TextAa],
    ["price_asc", "Menor precio", ArrowDown],
    ["price_desc", "Mayor precio", ArrowUp],
  ] as const;
  const selected = first(current.sort) ?? "featured";
  return (
    <div className="no-scrollbar flex max-w-full shrink overflow-x-auto rounded-xl bg-catalog-soft p-1" aria-label="Ordenar resultados">
      {options.map(([value, label, Icon]) => (
        <Link
          key={value}
          href={catalogHref(pathname, current, { sort: value, page: 1 })}
          scroll={false}
          aria-current={selected === value ? "page" : undefined}
          className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs transition-colors sm:px-3 ${selected === value ? "bg-brand-yellow font-semibold text-ink" : "text-muted hover:bg-soft-yellow hover:text-ink"}`}
        >
          <Icon size={14} weight={selected === value ? "bold" : "regular"} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </div>
  );
}

const first = (input: string | string[] | undefined) => (Array.isArray(input) ? input[0] : input);
