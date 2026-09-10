import Link from "next/link";

import type { CatalogLanding, CatalogSpecies, LifeStage, ProductDetail } from "@/domain/catalog/types";
import { findBestCatalogLanding } from "@/data/catalog-routes";

export function ProductTechnicalInfo({ product, catalogLandings }: { product: ProductDetail; catalogLandings: CatalogLanding[] }) {
  const technicalSheet = product.technicalSheet;
  const presentations = product.variants.map((variant) => variant.presentation ?? formatWeight(variant.weightGrams) ?? "Presentación");
  const species = technicalSheet.species ?? product.species;
  const lifeStage = technicalSheet.lifeStage ?? product.lifeStage;
  const categoryHref = findBestCatalogLanding(catalogLandings, {
    species: species ?? undefined,
    category: product.classification.category ?? undefined,
    foodType: product.classification.foodType ?? undefined,
    categorySlug: product.classification.category === "HYGIENE" ? product.category?.slug : undefined,
  })?.seo.canonical;

  return (
    <section className="mt-12 border-t border-catalog-line pt-8 sm:mt-16 sm:pt-10" aria-labelledby="technical-info-title">
      <div>
        <h2 id="technical-info-title" className="font-display text-3xl font-semibold sm:text-4xl">
          Características
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Consultá la marca, las presentaciones, para quién está indicado y la fuente de alimentación.
        </p>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white sm:mt-7">
        <table className="min-w-full table-fixed text-left text-sm">
          <tbody>
            <TechnicalRow label="Marca / fabricante">
              <Link href={`/marcas/${product.brand.slug}`} className="font-semibold text-brand-blue hover:underline">
                {product.brand.name}
              </Link>
            </TechnicalRow>
            {product.category ? (
              <TechnicalRow label="Categoría">
                <Link
                  href={categoryHref ?? "/"}
                  className="font-semibold text-brand-blue hover:underline"
                >
                  {product.category.name}
                </Link>
              </TechnicalRow>
            ) : null}
            {species ? (
              <TechnicalRow label="Para">
                <Link href={speciesPath(species)} className="font-semibold text-brand-blue hover:underline">
                  {species === "DOG" ? "Perros" : "Gatos"}
                </Link>
              </TechnicalRow>
            ) : null}
            {lifeStage ? (
              <TechnicalRow label="Etapa">
                <Link href={stagePath(catalogLandings, product, species, lifeStage)} className="font-semibold text-brand-blue hover:underline">
                  {stageCopy(lifeStage, species)}
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
                    {technicalSheet.feedingGuide.sourceLabel} <span className="sr-only">(abre en una pestaña nueva)</span>
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
      <td className="break-words px-4 py-4 text-ink [overflow-wrap:anywhere] sm:px-5">{children}</td>
    </tr>
  );
}

function speciesPath(species: CatalogSpecies) {
  return species === "DOG" ? "/perros" : "/gatos";
}

function stagePath(landings: CatalogLanding[], product: ProductDetail, species: CatalogSpecies | null, stage: string) {
  return (
    findBestCatalogLanding(landings, {
      species: species ?? undefined,
      category: product.classification.category ?? undefined,
      foodType: product.classification.foodType ?? undefined,
      categorySlug: product.classification.category === "HYGIENE" ? product.category?.slug : undefined,
      lifeStage: stage as LifeStage,
    })?.seo.canonical ?? `${species ? speciesPath(species) : "/perros"}?lifeStage=${encodeURIComponent(stage)}`
  );
}

function stageCopy(stage: string, species: CatalogSpecies | null) {
  if (stage === "PUPPY") return species === "CAT" ? "Gatito" : "Cachorro";
  return ({ ADULT: "Adulto", SENIOR: "Senior" } as Record<string, string>)[stage] ?? stage;
}

function formatWeight(weightGrams: number | null) {
  if (!weightGrams) return null;
  return weightGrams >= 1000 ? `${weightGrams / 1000} kg` : `${weightGrams} g`;
}
