import type { BuildPlanState, FoodBrand, FoodPresentation, PlanRecommendation, RecommendationInput } from "../types";
import {
  calculateEstimatedDuration,
  calculateObservedDailyConsumption,
  calculatePeriodConsumption,
  calculateReplenishmentDate,
  estimateDailyConsumption,
  selectRecommendedPresentation,
  parseDecimalInput,
} from "./calculations";

export type ResolvedFoodSelection = {
  foodName: string;
  currentPresentationGrams: number;
  availablePresentations: FoodPresentation[];
  mockDailyGramsPerKg?: number;
};

export function resolveFoodSelection(state: BuildPlanState, catalog: FoodBrand[]): ResolvedFoodSelection | null {
  if (state.food.mode === "custom") {
    const kilograms = parseDecimalInput(state.food.customPresentationKg);
    if (!state.food.customBrand.trim() || !state.food.customLine.trim() || !Number.isFinite(kilograms) || kilograms <= 0) {
      return null;
    }

    const presentation = {
      id: "custom-current",
      label: `${kilograms.toLocaleString("es-AR")} kg`,
      grams: kilograms * 1_000,
    };
    return {
      foodName: `${state.food.customBrand.trim()} ${state.food.customLine.trim()}`,
      currentPresentationGrams: presentation.grams,
      availablePresentations: [presentation],
    };
  }

  const brand = catalog.find((item) => item.id === state.food.brandId);
  const line = brand?.lines.find((item) => item.id === state.food.lineId);
  const presentation = line?.presentations.find((item) => item.id === state.food.presentationId);
  if (!brand || !line || !presentation) return null;

  return {
    foodName: `${brand.name} ${line.name}`,
    currentPresentationGrams: presentation.grams,
    availablePresentations: line.presentations,
    mockDailyGramsPerKg: line.mockDailyGramsPerKg,
  };
}

export function getDailyConsumptionForState(state: BuildPlanState, catalog: FoodBrand[]) {
  const food = resolveFoodSelection(state, catalog);
  const weightKg = parseDecimalInput(state.pet.weight);
  if (!food || !state.pet.species || !state.pet.lifeStage || !state.consumptionMode || !Number.isFinite(weightKg) || weightKg <= 0) {
    return null;
  }

  if (state.consumptionMode === "known") {
    const durationDays = Number(state.durationDays);
    if (!Number.isFinite(durationDays) || durationDays <= 0) return null;
    return calculateObservedDailyConsumption(food.currentPresentationGrams, durationDays);
  }

  return estimateDailyConsumption({
    species: state.pet.species,
    weightKg,
    lifeStage: state.pet.lifeStage,
    productGramsPerKg: food.mockDailyGramsPerKg,
  });
}

export function buildRecommendationForState(state: BuildPlanState, catalog: FoodBrand[], startDate: Date) {
  const food = resolveFoodSelection(state, catalog);
  const weightKg = parseDecimalInput(state.pet.weight);
  if (
    !food ||
    !state.pet.species ||
    !state.pet.lifeStage ||
    !state.consumptionMode ||
    !state.frequencyDays ||
    !Number.isFinite(weightKg) ||
    weightKg <= 0
  ) {
    return null;
  }

  const observedDurationDays = state.consumptionMode === "known" ? Number(state.durationDays) : undefined;
  if (state.consumptionMode === "known" && (!observedDurationDays || observedDurationDays <= 0)) {
    return null;
  }

  return buildMockRecommendation({
    petName: state.pet.name,
    species: state.pet.species,
    weightKg,
    lifeStage: state.pet.lifeStage,
    foodName: food.foodName,
    currentPresentationGrams: food.currentPresentationGrams,
    availablePresentations: food.availablePresentations,
    mockDailyGramsPerKg: food.mockDailyGramsPerKg,
    consumptionMode: state.consumptionMode,
    observedDurationDays,
    frequencyDays: state.frequencyDays,
    selectedPresentationId: state.selectedPresentationId,
    startDate,
  });
}

export function buildMockRecommendation(input: RecommendationInput): PlanRecommendation {
  const dailyConsumptionGrams =
    input.consumptionMode === "known"
      ? calculateObservedDailyConsumption(input.currentPresentationGrams, input.observedDurationDays!)
      : estimateDailyConsumption({
          species: input.species,
          weightKg: input.weightKg,
          lifeStage: input.lifeStage,
          productGramsPerKg: input.mockDailyGramsPerKg,
        });

  const periodConsumptionGrams = calculatePeriodConsumption(dailyConsumptionGrams, input.frequencyDays);

  const automaticSelection = selectRecommendedPresentation(periodConsumptionGrams, input.availablePresentations);

  const manuallySelected = input.selectedPresentationId
    ? input.availablePresentations.find((presentation) => presentation.id === input.selectedPresentationId)
    : undefined;

  const presentation = manuallySelected ?? automaticSelection.presentation;
  const bagQuantity = manuallySelected ? Math.max(1, Math.ceil(periodConsumptionGrams / presentation.grams)) : automaticSelection.quantity;
  const deliveredGrams = presentation.grams * bagQuantity;
  const estimatedDurationDays = calculateEstimatedDuration(deliveredGrams, dailyConsumptionGrams);

  return {
    petName: input.petName,
    foodName: input.foodName,
    dailyConsumptionGrams,
    consumptionSource: input.consumptionMode,
    periodDays: input.frequencyDays,
    periodConsumptionGrams,
    presentation,
    bagQuantity,
    deliveredGrams,
    estimatedDurationDays,
    replenishmentDate: calculateReplenishmentDate(input.startDate, estimatedDurationDays),
  };
}
