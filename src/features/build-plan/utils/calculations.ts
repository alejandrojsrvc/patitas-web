import type {
  FoodPresentation,
  LifeStage,
  PetSpecies,
} from "../types";

const lifeStageMultipliers: Record<LifeStage, number> = {
  puppy: 1.3,
  adult: 1,
  senior: 0.9,
};

const fallbackGramsPerKg: Record<PetSpecies, number> = {
  dog: 18,
  cat: 13,
};

function assertPositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} debe ser mayor a cero.`);
  }
}

export function parseDecimalInput(value: string) {
  const normalized = value.trim().replace(",", ".");
  return Number(normalized);
}

export function calculateObservedDailyConsumption(
  presentationGrams: number,
  durationDays: number,
) {
  assertPositive(presentationGrams, "La presentación");
  assertPositive(durationDays, "La duración");
  return presentationGrams / durationDays;
}

export function estimateDailyConsumption({
  species,
  weightKg,
  lifeStage,
  productGramsPerKg,
}: {
  species: PetSpecies;
  weightKg: number;
  lifeStage: LifeStage;
  productGramsPerKg?: number;
}) {
  assertPositive(weightKg, "El peso");
  const gramsPerKg = productGramsPerKg ?? fallbackGramsPerKg[species];
  assertPositive(gramsPerKg, "El factor de producto");
  return weightKg * gramsPerKg * lifeStageMultipliers[lifeStage];
}

export function calculatePeriodConsumption(
  dailyConsumptionGrams: number,
  periodDays: number,
) {
  assertPositive(dailyConsumptionGrams, "El consumo diario");
  assertPositive(periodDays, "El período");
  return dailyConsumptionGrams * periodDays;
}

export function selectRecommendedPresentation(
  requiredGrams: number,
  presentations: FoodPresentation[],
) {
  assertPositive(requiredGrams, "La necesidad del período");
  if (presentations.length === 0) {
    throw new Error("Se necesita al menos una presentación.");
  }

  const sorted = [...presentations].sort((a, b) => a.grams - b.grams);
  const coveringPresentation = sorted.find(
    (presentation) => presentation.grams >= requiredGrams,
  );

  if (coveringPresentation) {
    return { presentation: coveringPresentation, quantity: 1 };
  }

  const largest = sorted.at(-1)!;
  return {
    presentation: largest,
    quantity: Math.ceil(requiredGrams / largest.grams),
  };
}

export function calculateEstimatedDuration(
  deliveredGrams: number,
  dailyConsumptionGrams: number,
) {
  assertPositive(deliveredGrams, "La cantidad entregada");
  assertPositive(dailyConsumptionGrams, "El consumo diario");
  return deliveredGrams / dailyConsumptionGrams;
}

export function calculateReplenishmentDate(
  startDate: Date,
  estimatedDurationDays: number,
) {
  assertPositive(estimatedDurationDays, "La duración estimada");
  const result = new Date(startDate);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() + Math.round(estimatedDurationDays));
  return result;
}
