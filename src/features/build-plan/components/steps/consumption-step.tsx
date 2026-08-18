import { Question, Timer } from "@phosphor-icons/react";
import { OptionCard } from "../option-card";
import { StepIntro } from "../step-intro";
import type { BuildPlanState } from "../../types";
import type { BuildPlanAction } from "../../hooks/use-build-plan";

type ConsumptionStepProps = {
  state: BuildPlanState;
  errors: Record<string, string>;
  dispatch: React.Dispatch<BuildPlanAction>;
};

export function ConsumptionStep({
  state,
  errors,
  dispatch,
}: ConsumptionStepProps) {
  return (
    <div>
      <StepIntro
        title={`¿Cuánto suele durarle esta bolsa a ${state.pet.name}?`}
        description="Lo que observás en casa es el dato más útil para estimar su próxima reposición."
      />

      <fieldset aria-describedby={errors.consumption ? "consumption-error" : undefined}>
        <legend className="sr-only">Conocimiento de la duración</legend>
        <div className="grid gap-3">
          <OptionCard
            name="consumptionMode"
            value="known"
            checked={state.consumptionMode === "known"}
            onChange={() => dispatch({ type: "set-consumption-mode", mode: "known" })}
            title="Sé aproximadamente cuánto dura"
            description="Usamos tu experiencia antes que cualquier estimación."
            icon={<Timer size={25} weight="duotone" />}
            invalid={Boolean(errors.consumption)}
          />
          <OptionCard
            name="consumptionMode"
            value="estimated"
            checked={state.consumptionMode === "estimated"}
            onChange={() =>
              dispatch({ type: "set-consumption-mode", mode: "estimated" })
            }
            title="No estoy seguro"
            description="Armamos una estimación inicial con los datos disponibles."
            icon={<Question size={25} weight="duotone" />}
            invalid={Boolean(errors.consumption)}
          />
        </div>
      </fieldset>

      {state.consumptionMode === "known" ? (
        <div className="mt-7 max-w-xs">
          <label htmlFor="duration-days" className="font-semibold">
            ¿Cuántos días dura aproximadamente?
          </label>
          <div className="relative mt-2">
            <input
              id="duration-days"
              name="durationDays"
              type="number"
              inputMode="numeric"
              min="1"
              max="365"
              value={state.durationDays}
              onChange={(event) =>
                dispatch({ type: "set-duration", durationDays: event.target.value })
              }
              aria-invalid={Boolean(errors.durationDays)}
              aria-describedby={errors.durationDays ? "duration-error" : undefined}
              className="h-14 w-full rounded-xl border border-[#d6d6d0] bg-surface px-4 pr-16 text-base text-ink outline-none transition-[border-color,box-shadow] focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(0,85,255,0.12)]"
              placeholder="Ej.: 14…"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
              días
            </span>
          </div>
          {errors.durationDays ? (
            <p id="duration-error" className="mt-2 text-sm font-semibold text-[#b42318]">
              {errors.durationDays}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.consumptionMode === "estimated" ? (
        <div className="mt-7 rounded-2xl bg-soft-yellow p-5 text-sm leading-6 text-ink">
          <p className="font-bold">Estimación inicial</p>
          <p className="mt-1">
            Usaremos un cálculo mock basado en alimento, peso y etapa de vida.
            No reemplaza una indicación veterinaria.
          </p>
        </div>
      ) : null}

      {errors.consumption ? (
        <p id="consumption-error" className="mt-3 text-sm font-semibold text-[#b42318]">
          {errors.consumption}
        </p>
      ) : null}
    </div>
  );
}
