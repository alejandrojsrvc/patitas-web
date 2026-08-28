import type { Species } from "@/domain/catalog/types";

export type CatalogRoute = {
  species: Species;
  segments: string[];
  category?: string;
  title: string;
  description: string;
};

const routes: CatalogRoute[] = [
  { species: "dog", segments: [], title: "Todo para perros", description: "Alimento, snacks y esenciales de paseo para comprar una vez o reponer a tiempo." },
  { species: "dog", segments: ["alimentos"], category: "alimentos", title: "Alimento para perros", description: "Opciones secas y húmedas para cada etapa y tamaño, con presentaciones fáciles de comparar." },
  { species: "dog", segments: ["alimentos", "secos"], category: "alimento-seco", title: "Alimento seco para perros", description: "Compará marcas, etapas, pesos y precio por kilo antes de elegir la bolsa adecuada." },
  { species: "dog", segments: ["alimentos", "humedos"], category: "alimento-humedo", title: "Alimento húmedo para perros", description: "Latas y sobres para complementar o sostener la alimentación diaria de tu perro." },
  { species: "dog", segments: ["snacks"], category: "snacks", title: "Snacks para perros", description: "Premios y snacks para sumar a su rutina sin perder de vista cuándo reponerlos." },
  { species: "dog", segments: ["bolsas"], category: "bolsas-para-paseo", title: "Bolsas para paseo", description: "Un esencial recurrente para todos los paseos, disponible por presentación." },
  { species: "cat", segments: [], title: "Todo para gatos", description: "Alimento, arena y snacks para sostener su rutina sin compras de último momento." },
  { species: "cat", segments: ["alimentos"], category: "alimentos", title: "Alimento para gatos", description: "Encontrá alimento seco y húmedo según etapa, presentación y marca." },
  { species: "cat", segments: ["alimentos", "secos"], category: "alimento-seco", title: "Alimento seco para gatos", description: "Compará presentaciones y precio por kilo para elegir cuánto comprar." },
  { species: "cat", segments: ["alimentos", "humedos"], category: "alimento-humedo", title: "Alimento húmedo para gatos", description: "Sobres y latas para su alimentación diaria o complementaria." },
  { species: "cat", segments: ["arena"], category: "arena-y-piedras", title: "Arena y piedras para gatos", description: "Presentaciones para calcular mejor cuánto dura cada bolsa y cuándo volver a comprar." },
  { species: "cat", segments: ["snacks"], category: "snacks", title: "Snacks para gatos", description: "Opciones para sumar a su rutina y reponer cuando haga falta." },
];

export function resolveCatalogRoute(species: Species, segments: string[]): CatalogRoute | null {
  const path = segments.join("/");
  return routes.find((route) => route.species === species && route.segments.join("/") === path) ?? null;
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

export const indexableCatalogRoutes = routes;
