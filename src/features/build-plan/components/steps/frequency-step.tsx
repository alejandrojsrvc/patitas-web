import { CalendarDots, Timer } from "@phosphor-icons/react";
import { OptionCard } from "../option-card";
import { StepIntro } from "../step-intro";
import type { BuildPlanState } from "../../types";
import { formatKilograms } from "../../utils/formatters";
import type { BuildPlanAction } from "../../hooks/use-build-plan";

type FrequencyStepProps = {
  state: BuildPlanState;
  consumption15Days: number;
  consumption30Days: number;
  errors: Record<string, string>;
  dispatch: React.Dispatch<BuildPlanAction>;
};

export function FrequencyStep({
  state,
  consumption15Days,
  consumption30Days,
  errors,
  dispatch,
}: FrequencyStepProps) {
  return (
    <div>
      <StepIntro
        title="¿Qué ritmo te resulta más cómodo?"
        description={`${state.pet.name} consume aproximadamente ${formatKilograms(consumption30Days)} kg cada 30 días. La frecuencia es una preferencia inicial, no una obligación.`}
      />

      <fieldset aria-describedby={errors.frequency ? "frequency-error" : undefined}>
        <legend className="sr-only">Frecuencia de reposición</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            name="frequency"
            value="15"
            checked={state.frequencyDays === 15}
            onChange={() => dispatch({ type: "set-frequency", frequencyDays: 15 })}
            title="Cada 15 días"
            description={`Necesidad aproximada: ${formatKilograms(consumption15Days)} kg`}
            icon={<Timer size={26} weight="duotone" />}
            invalid={Boolean(errors.frequency)}
          />
          <OptionCard
            name="frequency"
            value="30"
            checked={state.frequencyDays === 30}
            onChange={() => dispatch({ type: "set-frequency", frequencyDays: 30 })}
            title="Cada 30 días"
            description={`Necesidad aproximada: ${formatKilograms(consumption30Days)} kg`}
            icon={<CalendarDots size={26} weight="duotone" />}
            invalid={Boolean(errors.frequency)}
          />
        </div>
      </fieldset>

      <p className="mt-6 text-sm leading-6 text-muted">
        La bolsa recomendada puede durar más o menos que este período. Te lo
        mostramos en el próximo paso.
      </p>
      {errors.frequency ? (
        <p id="frequency-error" className="mt-3 text-sm font-semibold text-[#b42318]">
          {errors.frequency}
        </p>
      ) : null}
    </div>
  );
}
