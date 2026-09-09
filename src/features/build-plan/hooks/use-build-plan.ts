"use client";

import { useReducer } from "react";
import type {
  BuildPlanState,
  ConsumptionMode,
  FoodSelectionMode,
  LeadDraft,
  PetDraft,
  SelectedConsumable,
  SubmissionStatus,
  WizardStep,
} from "../types";

export type BuildPlanAction =
  | { type: "go-to-step"; step: WizardStep }
  | { type: "update-pet"; value: Partial<PetDraft> }
  | { type: "set-food-mode"; mode: FoodSelectionMode }
  | { type: "select-brand"; brandId: string }
  | { type: "select-line"; lineId: string }
  | { type: "select-presentation"; presentationId: string }
  | {
      type: "update-custom-food";
      value: Partial<Pick<BuildPlanState["food"], "customBrand" | "customLine" | "customPresentationKg">>;
    }
  | { type: "set-consumption-mode"; mode: ConsumptionMode }
  | { type: "set-duration"; durationDays: string }
  | { type: "set-frequency"; frequencyDays: 15 | 30 }
  | { type: "set-recommended-presentation"; presentationId: string }
  | { type: "toggle-consumable"; selection: SelectedConsumable }
  | { type: "set-consumable-quantity"; selection: SelectedConsumable }
  | { type: "update-lead"; value: Partial<LeadDraft> }
  | { type: "set-submission-status"; status: SubmissionStatus };

const emptyFood: BuildPlanState["food"] = {
  mode: null,
  brandId: "",
  lineId: "",
  presentationId: "",
  customBrand: "",
  customLine: "",
  customPresentationKg: "",
};

export const initialBuildPlanState: BuildPlanState = {
  step: 1,
  pet: {
    species: null,
    name: "",
    weight: "",
    lifeStage: null,
  },
  food: emptyFood,
  consumptionMode: null,
  durationDays: "",
  frequencyDays: null,
  selectedPresentationId: "",
  selectedConsumables: [],
  lead: {
    ownerName: "",
    email: "",
    whatsapp: "",
    neighborhood: "",
  },
  submissionStatus: "idle",
};

function reducer(state: BuildPlanState, action: BuildPlanAction): BuildPlanState {
  switch (action.type) {
    case "go-to-step":
      return { ...state, step: action.step };
    case "update-pet": {
      const speciesChanged = action.value.species !== undefined && action.value.species !== state.pet.species;
      const recommendationChanged =
        speciesChanged ||
        (action.value.weight !== undefined && action.value.weight !== state.pet.weight) ||
        (action.value.lifeStage !== undefined && action.value.lifeStage !== state.pet.lifeStage);
      return {
        ...state,
        pet: { ...state.pet, ...action.value },
        submissionStatus: "idle",
        selectedPresentationId: recommendationChanged ? "" : state.selectedPresentationId,
        ...(speciesChanged
          ? {
              food: emptyFood,
              consumptionMode: null,
              durationDays: "",
              frequencyDays: null,
              selectedPresentationId: "",
              selectedConsumables: [],
            }
          : {}),
      };
    }
    case "set-food-mode":
      return {
        ...state,
        submissionStatus: "idle",
        food: { ...emptyFood, mode: action.mode },
        consumptionMode: null,
        durationDays: "",
        selectedPresentationId: "",
      };
    case "select-brand":
      return {
        ...state,
        submissionStatus: "idle",
        food: {
          ...state.food,
          mode: "catalog",
          brandId: action.brandId,
          lineId: "",
          presentationId: "",
        },
        consumptionMode: null,
        durationDays: "",
        selectedPresentationId: "",
      };
    case "select-line":
      return {
        ...state,
        submissionStatus: "idle",
        food: {
          ...state.food,
          lineId: action.lineId,
          presentationId: "",
        },
        consumptionMode: null,
        durationDays: "",
        selectedPresentationId: "",
      };
    case "select-presentation":
      return {
        ...state,
        submissionStatus: "idle",
        food: { ...state.food, presentationId: action.presentationId },
        consumptionMode: null,
        durationDays: "",
        selectedPresentationId: "",
      };
    case "update-custom-food":
      return {
        ...state,
        submissionStatus: "idle",
        food: { ...state.food, mode: "custom", ...action.value },
        selectedPresentationId: "",
      };
    case "set-consumption-mode":
      return {
        ...state,
        submissionStatus: "idle",
        consumptionMode: action.mode,
        durationDays: action.mode === "estimated" ? "" : state.durationDays,
        selectedPresentationId: "",
      };
    case "set-duration":
      return {
        ...state,
        submissionStatus: "idle",
        durationDays: action.durationDays,
        selectedPresentationId: "",
      };
    case "set-frequency":
      return {
        ...state,
        submissionStatus: "idle",
        frequencyDays: action.frequencyDays,
        selectedPresentationId: "",
      };
    case "set-recommended-presentation":
      return {
        ...state,
        selectedPresentationId: action.presentationId,
        submissionStatus: "idle",
      };
    case "toggle-consumable": {
      const exists = state.selectedConsumables.some((item) => item.id === action.selection.id);
      return {
        ...state,
        submissionStatus: "idle",
        selectedConsumables: exists
          ? state.selectedConsumables.filter((item) => item.id !== action.selection.id)
          : [...state.selectedConsumables, action.selection],
      };
    }
    case "set-consumable-quantity":
      return {
        ...state,
        submissionStatus: "idle",
        selectedConsumables: state.selectedConsumables.map((item) => (item.id === action.selection.id ? action.selection : item)),
      };
    case "update-lead":
      return {
        ...state,
        lead: { ...state.lead, ...action.value },
        submissionStatus: state.submissionStatus === "error" ? "idle" : state.submissionStatus,
      };
    case "set-submission-status":
      return { ...state, submissionStatus: action.status };
  }
}

export function useBuildPlan() {
  return useReducer(reducer, initialBuildPlanState);
}
