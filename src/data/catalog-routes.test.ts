import test from "node:test";
import assert from "node:assert/strict";
import { categoryPathForSpecies, categorySlugsForSpecies, resolveCatalogRoute } from "./catalog-routes.ts";

test("resuelve el catálogo general de cada especie", () => {
  assert.equal(resolveCatalogRoute("dog", [])?.title, "Todo para perros");
  assert.equal(resolveCatalogRoute("cat", [])?.title, "Todo para gatos");
});

test("mantiene categorías propias de perros y gatos", () => {
  assert.equal(categorySlugsForSpecies("dog").has("arena-y-piedras"), false);
  assert.equal(categorySlugsForSpecies("cat").has("bolsas-para-paseo"), false);
  assert.equal(categoryPathForSpecies("dog", "alimento-seco"), "/perros/alimentos/secos");
  assert.equal(categoryPathForSpecies("cat", "arena-y-piedras"), "/gatos/arena");
});
