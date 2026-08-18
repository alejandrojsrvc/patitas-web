import { Check } from "@phosphor-icons/react";
import { StepIntro } from "../step-intro";
import type {
  BuildPlanState,
  ConsumableOption,
  SelectedConsumable,
} from "../../types";
import type { BuildPlanAction } from "../../hooks/use-build-plan";
import { formatConsumableQuantity } from "../../utils/formatters";

type ConsumablesStepProps = {
  state: BuildPlanState;
  options: ConsumableOption[];
  dispatch: React.Dispatch<BuildPlanAction>;
};

export function ConsumablesStep({
  state,
  options,
  dispatch,
}: ConsumablesStepProps) {
  function getSelection(id: string) {
    return state.selectedConsumables.find((item) => item.id === id);
  }

  return (
    <div>
      <StepIntro
        title={`¿Qué más necesita ${state.pet.name} regularmente?`}
        description="Podés sumar solo lo que tenga sentido. También podés continuar sin elegir nada."
      />

      <fieldset>
        <legend className="sr-only">Otros consumibles</legend>
        <div className="space-y-3">
          {options.map((option) => {
            const selection = getSelection(option.id);
            const selected = Boolean(selection);
            return (
              <div
                key={option.id}
                className={`rounded-2xl border p-4 transition-[background-color,border-color] focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-brand-yellow sm:p-5 ${selected ? "border-brand-blue bg-soft-blue" : "border-border bg-surface"}`}
              >
                <label className="flex cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    name="consumables"
                    value={option.id}
                    checked={selected}
                    onChange={() =>
                      dispatch({
                        type: "toggle-consumable",
                        selection: {
                          id: option.id,
                          quantity: option.defaultQuantity,
                        } satisfies SelectedConsumable,
                      })
                    }
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border ${selected ? "border-brand-blue bg-brand-blue text-white" : "border-[#c9c9c3] bg-surface"}`}
                    aria-hidden="true"
                  >
                    {selected ? <Check size={15} weight="bold" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{option.name}</span>
                    <span className="mt-1 block text-sm text-muted">{option.detail}</span>
                  </span>
                </label>

                {selection ? (
                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#d6e2fa] pt-4">
                    <label htmlFor={`quantity-${option.id}`} className="text-sm font-semibold">
                      Cantidad
                    </label>
                    <select
                      id={`quantity-${option.id}`}
                      name={`quantity-${option.id}`}
                      value={selection.quantity}
                      onChange={(event) =>
                        dispatch({
                          type: "set-consumable-quantity",
                          selection: {
                            id: option.id,
                            quantity: Number(event.target.value),
                          },
                        })
                      }
                      className="h-11 rounded-xl border border-[#c9d6ee] bg-surface px-3 text-sm font-semibold text-ink outline-none focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(0,85,255,0.12)]"
                    >
                      {option.quantityOptions.map((quantity) => (
                        <option key={quantity} value={quantity}>
                          {formatConsumableQuantity(
                            quantity,
                            option.quantityLabel,
                          )}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
