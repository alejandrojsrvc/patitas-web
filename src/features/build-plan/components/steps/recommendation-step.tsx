import { BowlFood, CalendarDots, CheckCircle } from "@phosphor-icons/react";
import { OptionCard } from "../option-card";
import { StepIntro } from "../step-intro";
import type { FoodPresentation, PlanRecommendation } from "../../types";
import { formatGrams, formatKilograms, formatReplenishmentDate } from "../../utils/formatters";
import type { BuildPlanAction } from "../../hooks/use-build-plan";

type RecommendationStepProps = {
  recommendation: PlanRecommendation;
  presentations: FoodPresentation[];
  selectedPresentationId: string;
  dispatch: React.Dispatch<BuildPlanAction>;
};

export function RecommendationStep({ recommendation, presentations, selectedPresentationId, dispatch }: RecommendationStepProps) {
  const isManualSelection = Boolean(selectedPresentationId);
  const quantityPrefix = recommendation.bagQuantity > 1 ? `${recommendation.bagQuantity} bolsas de ` : "";

  return (
    <div>
      <StepIntro
        title={
          isManualSelection
            ? `Esta es la presentación que elegiste para ${recommendation.petName}.`
            : `Esta es la presentación que mejor acompaña el ritmo de ${recommendation.petName}.`
        }
        description="Usamos bolsas cerradas y te mostramos cuánto podrían durar realmente."
      />

      <article className="overflow-hidden rounded-3xl bg-brand-blue text-white shadow-[0_12px_30px_rgba(0,58,177,0.14)]">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-white/90">{recommendation.foodName}</p>
              <h2 className="mt-2 font-display text-4xl font-semibold leading-none">
                {quantityPrefix}
                {recommendation.presentation.label}
              </h2>
            </div>
            <span className="rounded-full bg-brand-yellow px-3 py-1.5 text-xs font-bold text-ink">
              {isManualSelection ? "ELEGIDA POR VOS" : "RECOMENDADO"}
            </span>
          </div>

          <div className="mt-8 grid gap-5 border-t border-white/20 pt-6 sm:grid-cols-3">
            <div>
              <BowlFood size={24} weight="duotone" className="text-brand-yellow" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold tracking-wide text-white/80">CONSUMO DIARIO</p>
              <p className="mt-1 font-display text-2xl font-semibold">≈ {formatGrams(recommendation.dailyConsumptionGrams)} g</p>
            </div>
            <div>
              <CheckCircle size={24} weight="duotone" className="text-brand-yellow" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold tracking-wide text-white/80">DURACIÓN ESTIMADA</p>
              <p className="mt-1 font-display text-2xl font-semibold">≈ {Math.round(recommendation.estimatedDurationDays)} días</p>
            </div>
            <div>
              <CalendarDots size={24} weight="duotone" className="text-brand-yellow" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold tracking-wide text-white/80">PRÓXIMA REPOSICIÓN</p>
              <p className="mt-1 font-display text-2xl font-semibold">{formatReplenishmentDate(recommendation.replenishmentDate)}</p>
            </div>
          </div>
        </div>
        <p className="bg-[#064bdd] px-6 py-4 text-sm text-white/90 sm:px-8">
          Para {recommendation.periodDays} días estimamos una necesidad de {formatKilograms(recommendation.periodConsumptionGrams)} kg. La
          entrega propuesta cubre {formatKilograms(recommendation.deliveredGrams)} kg.
        </p>
      </article>

      {presentations.length > 1 ? (
        <details className="mt-6 border-y border-border py-1">
          <summary className="cursor-pointer py-4 font-semibold text-brand-blue">Prefiero revisar otra presentación</summary>
          <fieldset className="grid gap-3 pb-5 sm:grid-cols-3">
            <legend className="sr-only">Elegir otra presentación</legend>
            {presentations.map((presentation) => (
              <OptionCard
                key={presentation.id}
                name="recommendedPresentation"
                value={presentation.id}
                checked={(selectedPresentationId || recommendation.presentation.id) === presentation.id}
                onChange={() =>
                  dispatch({
                    type: "set-recommended-presentation",
                    presentationId: presentation.id,
                  })
                }
                title={presentation.label}
              />
            ))}
          </fieldset>
        </details>
      ) : null}

      <p className="mt-5 text-sm leading-6 text-muted">
        {recommendation.consumptionSource === "known"
          ? "Calculado según la duración que nos indicaste."
          : "Estimación inicial mock. No es una recomendación veterinaria exacta."}
      </p>
    </div>
  );
}
