import type { PetSpecies } from "@/types/landing";

export type { PetSpecies } from "@/types/landing";

export type LifeStage = "puppy" | "adult" | "senior";
export type ConsumptionMode = "known" | "estimated";
export type FoodSelectionMode = "catalog" | "custom";
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type FoodPresentation = {
  id: string;
  label: string;
  grams: number;
};

export type FoodLine = {
  id: string;
  name: string;
  mockDailyGramsPerKg?: number;
  presentations: FoodPresentation[];
};

export type FoodBrand = {
  id: string;
  name: string;
  species: PetSpecies;
  lines: FoodLine[];
};

export type ConsumableOption = {
  id: string;
  species: PetSpecies;
  name: string;
  detail: string;
  quantityLabel: string;
  quantityOptions: number[];
  defaultQuantity: number;
};

export type SelectedConsumable = {
  id: string;
  quantity: number;
};

export type PetDraft = {
  species: PetSpecies | null;
  name: string;
  weight: string;
  lifeStage: LifeStage | null;
};

export type FoodSelection = {
  mode: FoodSelectionMode | null;
  brandId: string;
  lineId: string;
  presentationId: string;
  customBrand: string;
  customLine: string;
  customPresentationKg: string;
};

export type LeadDraft = {
  ownerName: string;
  email: string;
  whatsapp: string;
  neighborhood: string;
};

export type SubmissionStatus = "idle" | "submitting" | "success" | "error";

export type BuildPlanState = {
  step: WizardStep;
  pet: PetDraft;
  food: FoodSelection;
  consumptionMode: ConsumptionMode | null;
  durationDays: string;
  frequencyDays: 15 | 30 | null;
  selectedPresentationId: string;
  selectedConsumables: SelectedConsumable[];
  lead: LeadDraft;
  submissionStatus: SubmissionStatus;
};

export type RecommendationInput = {
  petName: string;
  species: PetSpecies;
  weightKg: number;
  lifeStage: LifeStage;
  foodName: string;
  currentPresentationGrams: number;
  availablePresentations: FoodPresentation[];
  mockDailyGramsPerKg?: number;
  consumptionMode: ConsumptionMode;
  observedDurationDays?: number;
  frequencyDays: 15 | 30;
  selectedPresentationId?: string;
  startDate: Date;
};

export type PlanRecommendation = {
  petName: string;
  foodName: string;
  dailyConsumptionGrams: number;
  consumptionSource: ConsumptionMode;
  periodDays: 15 | 30;
  periodConsumptionGrams: number;
  presentation: FoodPresentation;
  bagQuantity: number;
  deliveredGrams: number;
  estimatedDurationDays: number;
  replenishmentDate: Date;
};

export type LeadCapturePayload = {
  plan: {
    pet: PetDraft;
    foodName: string;
    dailyConsumptionGrams: number;
    frequencyDays: 15 | 30;
    presentationGrams: number;
    bagQuantity: number;
    estimatedDurationDays: number;
    replenishmentDate: string;
    consumables: SelectedConsumable[];
  };
  contact: LeadDraft;
};
