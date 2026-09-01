import type { Brand } from "@/domain/catalog/types";

const localBrandLogos: Record<string, string> = {
  "dog-chow": "/brand/logos/dog-chow.webp",
  "old-prince": "/brand/logos/old-prince.webp",
  "royal-canin": "/brand/logos/royal-canin.webp",
  "pro-plan": "/brand/logos/pro-plan.webp",
  proplan: "/brand/logos/pro-plan.webp",
  excellent: "/brand/logos/excellent.webp",
  pedigree: "/brand/logos/pedigree.webp",
};

export function brandLogoUrl(brand: Pick<Brand, "name" | "slug" | "logoUrl">) {
  const key = normalizeBrandKey(`${brand.slug} ${brand.name}`);
  const localKey = Object.keys(localBrandLogos).find((candidate) => key.includes(candidate));
  return localKey ? localBrandLogos[localKey] : brand.logoUrl;
}

function normalizeBrandKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, "-");
}
