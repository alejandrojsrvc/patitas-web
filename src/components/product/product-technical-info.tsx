import Link from "next/link";

import type { ProductDetail } from "@/domain/catalog/types";

export function ProductTechnicalInfo({ product }: { product: ProductDetail }) {
  const technicalSheet = product.technicalSheet;
  const presentations = product.variants.map((variant) => variant.presentation ?? formatWeight(variant.weightGrams) ?? "Presentación");
  const species = technicalSheet.species ?? product.species;
  const lifeStage = technicalSheet.lifeStage ?? product.lifeStage;

  return (
    <section className="mt-12 border-t border-catalog-line pt-8 sm:mt-16 sm:pt-10" aria-labelledby="technical-info-title">
      <div>
        <h2 id="technical-info-title" className="font-display text-3xl font-semibold sm:text-4xl">
          Características
        </h2>
        <p className="mt-3 max-w-2xl text-muted">Información de marca, presentación y características del producto.</p>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl bg-white sm:mt-7">
        <table className="w-full table-fixed text-left text-sm">
          <tbody>
            <TechnicalRow label="Marca / fabricante">
              <Link href={`/marcas/${product.brand.slug}`} className="font-semibold text-brand-blue hover:underline">
                {product.brand.name}
              </Link>
            </TechnicalRow>
            {product.category ? (
              <TechnicalRow label="Categoría">
                <Link
                  href={`/buscar?category=${encodeURIComponent(product.category.slug)}`}
                  className="font-semibold text-brand-blue hover:underline"
                >
                  {product.category.name}
                </Link>
              </TechnicalRow>
            ) : null}
            {species ? (
              <TechnicalRow label="Para">
                <Link href={speciesPath(species)} className="font-semibold text-brand-blue hover:underline">
                  {species === "dog" ? "Perros" : "Gatos"}
                </Link>
              </TechnicalRow>
            ) : null}
            {lifeStage ? (
              <TechnicalRow label="Etapa">
                <Link href={stagePath(species, lifeStage)} className="font-semibold text-brand-blue hover:underline">
                  {stageCopy(lifeStage)}
                </Link>
              </TechnicalRow>
            ) : null}
            <TechnicalRow label="Presentaciones">
              <div className="flex flex-wrap gap-1.5">
                {presentations.map((presentation, index) => (
                  <span key={`${presentation}-${index}`} className="rounded-lg bg-catalog-soft px-2.5 py-1.5 font-semibold text-ink">
                    {presentation}
                  </span>
                ))}
              </div>
            </TechnicalRow>
            {technicalSheet.feedingGuide ? (
              <TechnicalRow label="Fuente del fabricante">
                {technicalSheet.feedingGuide.sourceUrl ? (
                  <a
                    href={technicalSheet.feedingGuide.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-blue hover:underline"
                  >
                    {technicalSheet.feedingGuide.sourceLabel}
                  </a>
                ) : (
                  technicalSheet.feedingGuide.sourceLabel
                )}
              </TechnicalRow>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TechnicalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-catalog-line last:border-b-0">
      <th scope="row" className="w-[38%] bg-catalog-soft px-4 py-4 text-left font-medium text-muted sm:w-2/5 sm:px-5">
        {label}
      </th>
      <td className="break-words px-4 py-4 text-ink sm:px-5">{children}</td>
    </tr>
  );
}

function speciesPath(species: "dog" | "cat") {
  return species === "dog" ? "/perros" : "/gatos";
}

function stagePath(species: "dog" | "cat" | null, stage: string) {
  const params = new URLSearchParams({ lifeStage: stage });
  return `${species ? speciesPath(species) : "/buscar"}?${params.toString()}`;
}

function stageCopy(stage: string) {
  return ({ puppy: "Cachorro", kitten: "Gatito", adult: "Adulto", senior: "Senior" } as Record<string, string>)[stage] ?? stage;
}

function formatWeight(weightGrams: number | null) {
  if (!weightGrams) return null;
  return weightGrams >= 1000 ? `${weightGrams / 1000} kg` : `${weightGrams} g`;
}
