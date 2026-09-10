import assert from "node:assert/strict";
import test from "node:test";

import type { CatalogLanding } from "@/domain/catalog/types";
import { findBestCatalogLanding, findCatalogLanding } from "./catalog-routes.ts";

const landing = (canonical: string, filters: CatalogLanding["filters"]): CatalogLanding => ({
  kind: "LANDING",
  landingType: "CATALOG",
  filters,
  seo: { title: canonical, h1: canonical, description: canonical, canonical, robots: { index: true, follow: true } },
  breadcrumbs: [],
});

const landings = [
  landing("/perros", { species: "DOG" }),
  landing("/perros/alimentos-balanceados", { species: "DOG", category: "FOOD", foodType: "DRY" }),
  landing("/perros/alimentos-balanceados/adultos", {
    species: "DOG",
    category: "FOOD",
    foodType: "DRY",
    lifeStage: "ADULT",
  }),
  landing("/perros/alimentos-balanceados/adultos/royal-canin", {
    species: "DOG",
    category: "FOOD",
    foodType: "DRY",
    lifeStage: "ADULT",
    brand: "royal-canin",
  }),
];

test("encuentra solo una landing registrada para la combinación exacta", () => {
  assert.equal(
    findCatalogLanding(landings, {
      species: "DOG",
      category: "FOOD",
      foodType: "DRY",
      lifeStage: ["ADULT"],
      brand: ["royal-canin"],
    })?.seo.canonical,
    "/perros/alimentos-balanceados/adultos/royal-canin",
  );
  assert.equal(
    findCatalogLanding(landings, {
      species: "DOG",
      category: "FOOD",
      foodType: "DRY",
      lifeStage: ["ADULT"],
      brand: ["inexistente"],
    }),
    undefined,
  );
});

test("usa la landing más específica y deja filtros múltiples fuera de la ruta", () => {
  assert.equal(
    findBestCatalogLanding(landings, {
      species: "DOG",
      category: "FOOD",
      foodType: "DRY",
      lifeStage: ["ADULT"],
      brand: ["royal-canin", "excellent"],
    })?.seo.canonical,
    "/perros/alimentos-balanceados/adultos",
  );
});
