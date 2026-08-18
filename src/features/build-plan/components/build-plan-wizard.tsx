"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useBuildPlan } from "../hooks/use-build-plan";
import type { ConsumableOption, FoodBrand, WizardStep } from "../types";
import { calculatePeriodConsumption, parseDecimalInput } from "../utils/calculations";
import {
  buildRecommendationForState,
  getDailyConsumptionForState,
  resolveFoodSelection,
} from "../utils/build-recommendation";
import { savePlanMock } from "../services/save-plan";
import { WizardActions } from "./wizard-actions";
import { WizardShell } from "./wizard-shell";
import { ConsumptionStep } from "./steps/consumption-step";
import { ConsumablesStep } from "./steps/consumables-step";
import { FoodStep } from "./steps/food-step";
import { FrequencyStep } from "./steps/frequency-step";
import { PetStep } from "./steps/pet-step";
import { RecommendationStep } from "./steps/recommendation-step";
import { ResultStep } from "./steps/result-step";

type BuildPlanWizardProps = {
  catalog: FoodBrand[];
  consumables: ConsumableOption[];
};

function validateStep(
  step: WizardStep,
  petPhase: 1 | 2 | 3,
  state: ReturnType<typeof useBuildPlan>[0],
  catalog: FoodBrand[],
) {
  const errors: Record<string, string> = {};

  if (step === 1) {
    const weight = parseDecimalInput(state.pet.weight);
    if (petPhase === 1 && !state.pet.species) {
      errors.species = "Elegí perro o gato para continuar.";
    }
    if (petPhase === 2) {
      if (!state.pet.name.trim()) errors.name = "Contanos cómo se llama.";
      if (!Number.isFinite(weight) || weight < 0.1 || weight > 120) {
        errors.weight = "Ingresá un peso válido entre 0,1 y 120 kg.";
      }
    }
    if (petPhase === 3 && !state.pet.lifeStage) {
      errors.lifeStage = "Elegí una etapa de vida.";
    }
  }

  if (step === 2 && !resolveFoodSelection(state, catalog)) {
    errors.food =
      state.food.mode === "custom"
        ? "Completá marca, producto y peso de la bolsa actual."
        : "Elegí marca, producto y presentación para continuar.";
  }
  if (step === 2 && state.food.mode === "custom") {
    const customWeight = parseDecimalInput(state.food.customPresentationKg);
    if (!state.food.customBrand.trim()) {
      errors.customBrand = "Ingresá la marca del alimento.";
    }
    if (!state.food.customLine.trim()) {
      errors.customLine = "Ingresá el producto o la línea.";
    }
    if (!Number.isFinite(customWeight) || customWeight <= 0 || customWeight > 50) {
      errors.customPresentationKg = "Ingresá un peso de bolsa válido.";
    }
  }

  if (step === 3) {
    if (!state.consumptionMode) {
      errors.consumption = "Elegí la opción que mejor describa lo que sabés.";
    }
    if (state.consumptionMode === "known") {
      const duration = Number(state.durationDays);
      if (!Number.isFinite(duration) || duration < 1 || duration > 365) {
        errors.durationDays = "Ingresá una duración entre 1 y 365 días.";
      }
    }
  }

  if (step === 4 && !state.frequencyDays) {
    errors.frequency = "Elegí un ritmo inicial para continuar.";
  }

  return errors;
}

function validateLead(
  lead: ReturnType<typeof useBuildPlan>[0]["lead"],
) {
  const errors: Record<string, string> = {};
  if (!lead.ownerName.trim()) errors.ownerName = "Ingresá tu nombre.";
  if (!/^\S+@\S+\.\S+$/.test(lead.email.trim())) {
    errors.email = "Ingresá un email válido, por ejemplo vos@ejemplo.com.";
  }
  if (!lead.neighborhood.trim()) {
    errors.neighborhood = "Ingresá tu barrio o código postal.";
  }
  return errors;
}

export function BuildPlanWizard({
  catalog,
  consumables,
}: BuildPlanWizardProps) {
  const [state, dispatch] = useBuildPlan();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionStart] = useState(() => new Date());
  const [petPhase, setPetPhase] = useState<1 | 2 | 3>(1);

  const resolvedFood = resolveFoodSelection(state, catalog);
  const dailyConsumption = getDailyConsumptionForState(state, catalog);
  const recommendation = buildRecommendationForState(
    state,
    catalog,
    sessionStart,
  );
  const availableConsumables = consumables.filter(
    (option) => option.species === state.pet.species,
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-step-heading]")?.focus();
      window.scrollTo({ top: 0 });
    });
  }, [state.step, petPhase]);

  function focusFirstError() {
    requestAnimationFrame(() => {
      const invalid = document.querySelector<HTMLElement>(
        '[aria-invalid="true"], [data-invalid="true"] input',
      );
      (invalid ?? document.querySelector<HTMLElement>("[data-step-heading]"))?.focus();
    });
  }

  function goToStep(step: WizardStep) {
    setErrors({});
    dispatch({ type: "go-to-step", step });
  }

  function handleStepSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateStep(state.step, petPhase, state, catalog);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstError();
      return;
    }

    setErrors({});
    if (state.step === 1 && petPhase < 3) {
      setPetPhase((petPhase + 1) as 2 | 3);
      return;
    }
    goToStep(Math.min(7, state.step + 1) as WizardStep);
  }

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recommendation) return;

    const nextErrors = validateLead(state.lead);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstError();
      return;
    }

    setErrors({});
    dispatch({ type: "set-submission-status", status: "submitting" });
    try {
      await savePlanMock({
        plan: {
          pet: state.pet,
          foodName: recommendation.foodName,
          dailyConsumptionGrams: recommendation.dailyConsumptionGrams,
          frequencyDays: recommendation.periodDays,
          presentationGrams: recommendation.presentation.grams,
          bagQuantity: recommendation.bagQuantity,
          estimatedDurationDays: recommendation.estimatedDurationDays,
          replenishmentDate: recommendation.replenishmentDate.toISOString(),
          consumables: state.selectedConsumables,
        },
        contact: state.lead,
      });
      dispatch({ type: "set-submission-status", status: "success" });
    } catch {
      dispatch({ type: "set-submission-status", status: "error" });
    }
  }

  let stepContent: React.ReactNode = null;

  if (state.step === 1) {
    stepContent = (
      <PetStep
        state={state}
        phase={petPhase}
        errors={errors}
        updatePet={dispatch}
      />
    );
  }
  if (state.step === 2) {
    stepContent = (
      <FoodStep state={state} catalog={catalog} errors={errors} dispatch={dispatch} />
    );
  }
  if (state.step === 3) {
    stepContent = (
      <ConsumptionStep state={state} errors={errors} dispatch={dispatch} />
    );
  }
  if (state.step === 4 && dailyConsumption) {
    stepContent = (
      <FrequencyStep
        state={state}
        consumption15Days={calculatePeriodConsumption(dailyConsumption, 15)}
        consumption30Days={calculatePeriodConsumption(dailyConsumption, 30)}
        errors={errors}
        dispatch={dispatch}
      />
    );
  }
  if (state.step === 5 && recommendation && resolvedFood) {
    stepContent = (
      <RecommendationStep
        recommendation={recommendation}
        presentations={resolvedFood.availablePresentations}
        selectedPresentationId={state.selectedPresentationId}
        dispatch={dispatch}
      />
    );
  }
  if (state.step === 6) {
    stepContent = (
      <ConsumablesStep
        state={state}
        options={availableConsumables}
        dispatch={dispatch}
      />
    );
  }

  return (
    <WizardShell step={state.step}>
      {state.step === 7 && recommendation ? (
        <ResultStep
          state={state}
          recommendation={recommendation}
          consumables={availableConsumables}
          errors={errors}
          dispatch={dispatch}
          onEdit={() => {
            dispatch({ type: "set-submission-status", status: "idle" });
            setPetPhase(1);
            goToStep(1);
          }}
          onSubmit={handleLeadSubmit}
        />
      ) : (
        <form onSubmit={handleStepSubmit} noValidate className="flex min-h-full flex-1 flex-col">
          {stepContent}
          {Object.keys(errors).length > 0 ? (
            <p className="sr-only" role="alert">
              Revisá los campos indicados para continuar.
            </p>
          ) : null}
          <WizardActions
            canGoBack={state.step > 1 || petPhase > 1}
            onBack={() => {
              if (state.step === 1 && petPhase > 1) {
                setErrors({});
                setPetPhase((petPhase - 1) as 1 | 2);
                return;
              }
              goToStep((state.step - 1) as WizardStep);
            }}
            nextLabel={state.step === 6 ? "Ver su Patitas" : "Continuar"}
          />
        </form>
      )}
    </WizardShell>
  );
}
