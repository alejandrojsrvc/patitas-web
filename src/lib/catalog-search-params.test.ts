import assert from "node:assert/strict";
import test from "node:test";

import { productFiltersFromSearchParams } from "./catalog-search-params.ts";

test("acepta pesos repetidos y separados por coma", () => {
  const filters = productFiltersFromSearchParams({ weightGrams: ["15000,20000", "15000"] });
  assert.deepEqual(filters.weightGrams, [15000, 20000]);
});

test("acepta varias marcas y etapas en la URL", () => {
  const filters = productFiltersFromSearchParams({ brand: "excellent,pro-plan", lifeStage: ["adult", "senior"] });
  assert.deepEqual(filters.brand, ["excellent", "pro-plan"]);
  assert.deepEqual(filters.lifeStage, ["adult", "senior"]);
});
