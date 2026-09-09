import type { Species } from "@/domain/catalog/types";

export type CatalogRoute = {
  species: Species;
  segments: string[];
  categorySegments: string[];
  category?: string;
  brand?: string;
  lifeStage?: string;
  title: string;
  description: string;
};

type CatalogRouteDefinition = Omit<CatalogRoute, "categorySegments" | "brand" | "lifeStage">;

const routes: CatalogRouteDefinition[] = [
  {
    species: "dog",
    segments: [],
    title: "Todo para perros",
    description: "Alimento, snacks y esenciales de paseo para comprar una vez o reponer a tiempo.",
  },
  {
    species: "dog",
    segments: ["alimentos"],
    category: "alimentos",
    title: "Alimento para perros",
    description: "Opciones secas y húmedas para cada etapa y tamaño, con presentaciones fáciles de comparar.",
  },
  {
    species: "dog",
    segments: ["alimentos", "secos"],
    category: "alimento-seco",
    title: "Alimento seco para perros",
    description: "Compará marcas, etapas, pesos y precio por kilo antes de elegir la bolsa adecuada.",
  },
  {
    species: "dog",
    segments: ["alimentos", "humedos"],
    category: "alimento-humedo",
    title: "Alimento húmedo para perros",
    description: "Latas y sobres para complementar o sostener la alimentación diaria de tu perro.",
  },
  {
    species: "dog",
    segments: ["snacks"],
    category: "snacks",
    title: "Snacks para perros",
    description: "Premios y snacks para sumar a su rutina sin perder de vista cuándo reponerlos.",
  },
  {
    species: "dog",
    segments: ["bolsas"],
    category: "bolsas-para-paseo",
    title: "Bolsas para paseo",
    description: "Un esencial recurrente para todos los paseos, disponible por presentación.",
  },
  {
    species: "cat",
    segments: [],
    title: "Todo para gatos",
    description: "Alimento, arena y snacks para sostener su rutina sin compras de último momento.",
  },
  {
    species: "cat",
    segments: ["alimentos"],
    category: "alimentos",
    title: "Alimento para gatos",
    description: "Encontrá alimento seco y húmedo según etapa, presentación y marca.",
  },
  {
    species: "cat",
    segments: ["alimentos", "secos"],
    category: "alimento-seco",
    title: "Alimento seco para gatos",
    description: "Compará presentaciones y precio por kilo para elegir cuánto comprar.",
  },
  {
    species: "cat",
    segments: ["alimentos", "humedos"],
    category: "alimento-humedo",
    title: "Alimento húmedo para gatos",
    description: "Sobres y latas para su alimentación diaria o complementaria.",
  },
  {
    species: "cat",
    segments: ["arena"],
    category: "arena-y-piedras",
    title: "Arena y piedras para gatos",
    description: "Presentaciones para calcular mejor cuánto dura cada bolsa y cuándo volver a comprar.",
  },
  {
    species: "cat",
    segments: ["snacks"],
    category: "snacks",
    title: "Snacks para gatos",
    description: "Opciones para sumar a su rutina y reponer cuando haga falta.",
  },
];

const lifeStageSegments: Record<Species, Record<string, string>> = {
  dog: { puppy: "cachorro", adult: "adulto", senior: "senior" },
  cat: { kitten: "gatito", adult: "adulto", senior: "senior" },
};

const catalogSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function resolveCatalogRoute(species: Species, segments: string[]): CatalogRoute | null {
  const baseRoute = routes
    .filter(
      (route) =>
        route.species === species &&
        route.segments.length <= segments.length &&
        route.segments.every((segment, index) => segments[index] === segment),
    )
    .sort((left, right) => right.segments.length - left.segments.length)[0];
  if (!baseRoute) return null;

  const facetSegments = segments.slice(baseRoute.segments.length);
  if (facetSegments.length > 2 || facetSegments.some((segment) => !catalogSlugPattern.test(segment))) return null;

  const stageBySegment = Object.fromEntries(
    Object.entries(lifeStageSegments[species]).map(([value, segment]) => [segment, value]),
  );
  const brand = facetSegments.length === 2 ? facetSegments[0] : facetSegments.length === 1 && !stageBySegment[facetSegments[0]] ? facetSegments[0] : undefined;
  const lifeStageSegment = facetSegments.length === 2 ? facetSegments[1] : brand ? undefined : facetSegments[0];
  const lifeStage = lifeStageSegment ? stageBySegment[lifeStageSegment] : undefined;
  if (lifeStageSegment && !lifeStage) return null;

  const brandLabel = brand ? brand.split("-").map(capitalize).join(" ") : undefined;
  const stageLabel = lifeStage ? lifeStageSeoLabel(lifeStage) : undefined;
  const qualifier = [brandLabel, stageLabel ? `para ${stageLabel}` : undefined].filter(Boolean).join(" ");

  return {
    ...baseRoute,
    segments,
    categorySegments: baseRoute.segments,
    brand,
    lifeStage,
    title: qualifier ? `${baseRoute.title} ${qualifier}` : baseRoute.title,
    description: qualifier
      ? `${baseRoute.description} Encontrá opciones ${brandLabel ? `de ${brandLabel}` : ""}${stageLabel ? ` para ${stageLabel}` : ""}.`
          .replace(/\s+/g, " ")
          .trim()
      : baseRoute.description,
  };
}

export function catalogPath(species: Species, segments: string[] = []) {
  return `/${species === "dog" ? "perros" : "gatos"}${segments.length ? `/${segments.join("/")}` : ""}`;
}

export function categorySlugsForSpecies(species: Species) {
  return new Set(routes.filter((route) => route.species === species && route.category).map((route) => route.category));
}

export function categoryPathForSpecies(species: Species, category: string) {
  const route = routes.find((item) => item.species === species && item.category === category);
  return route ? catalogPath(species, route.segments) : null;
}

export function catalogFacetedPath(pathname: string, species: Species, brand?: string, lifeStage?: string) {
  if (brand && !catalogSlugPattern.test(brand)) return null;
  const stageSegment = lifeStage ? lifeStageSegments[species][lifeStage] : undefined;
  if (lifeStage && !stageSegment) return null;
  return `${pathname}${brand ? `/${brand}` : ""}${stageSegment ? `/${stageSegment}` : ""}`;
}

function lifeStageSeoLabel(lifeStage: string) {
  if (lifeStage === "puppy") return "cachorros";
  if (lifeStage === "kitten") return "gatitos";
  if (lifeStage === "adult") return "adultos";
  return "senior";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const indexableCatalogRoutes = routes;
