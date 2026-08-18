import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateEstimatedDuration,
  calculateObservedDailyConsumption,
  calculatePeriodConsumption,
  estimateDailyConsumption,
  selectRecommendedPresentation,
} from "./calculations.ts";

const presentations = [
  { id: "3kg", label: "3 kg", grams: 3_000 },
  { id: "7-5kg", label: "7,5 kg", grams: 7_500 },
  { id: "15kg", label: "15 kg", grams: 15_000 },
];

test("calcula consumo diario observado", () => {
  assert.equal(Math.round(calculateObservedDailyConsumption(3_000, 14)), 214);
});

test("estima consumo diario con peso, producto y etapa", () => {
  assert.equal(
    estimateDailyConsumption({
      species: "dog",
      weightKg: 10,
      lifeStage: "senior",
      productGramsPerKg: 18,
    }),
    162,
  );
});

test("calcula la necesidad de un período", () => {
  assert.equal(calculatePeriodConsumption(214, 30), 6_420);
});

test("selecciona la bolsa cerrada más pequeña que cubre el período", () => {
  assert.deepEqual(selectRecommendedPresentation(6_420, presentations), {
    presentation: presentations[1],
    quantity: 1,
  });
});

test("usa varias bolsas enteras si la mayor no alcanza", () => {
  assert.deepEqual(selectRecommendedPresentation(31_000, presentations), {
    presentation: presentations[2],
    quantity: 3,
  });
});

test("calcula duración estimada de la entrega", () => {
  assert.equal(Math.round(calculateEstimatedDuration(7_500, 214)), 35);
});
