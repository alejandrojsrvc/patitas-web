import { MagnifyingGlass } from "@phosphor-icons/react";
import { OptionCard } from "../option-card";
import { StepIntro } from "../step-intro";
import type { BuildPlanState, FoodBrand } from "../../types";
import type { BuildPlanAction } from "../../hooks/use-build-plan";

type FoodStepProps = {
  state: BuildPlanState;
  catalog: FoodBrand[];
  errors: Record<string, string>;
  dispatch: React.Dispatch<BuildPlanAction>;
};

const inputClass =
  "mt-2 h-14 w-full rounded-xl border border-[#d6d6d0] bg-surface px-4 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-[#85857f] focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(0,85,255,0.12)]";

export function FoodStep({ state, catalog, errors, dispatch }: FoodStepProps) {
  const brands = catalog.filter((brand) => brand.species === state.pet.species);
  const selectedBrand = brands.find((brand) => brand.id === state.food.brandId);
  const selectedLine = selectedBrand?.lines.find(
    (line) => line.id === state.food.lineId,
  );

  return (
    <div>
      <StepIntro
        title={`¿Qué come ${state.pet.name}?`}
        description="Buscá su alimento actual. No vamos a pedirte que cambies lo que ya le funciona."
      />

      <fieldset aria-describedby={errors.food ? "food-error" : undefined}>
        <legend className="mb-3 font-semibold">Marca</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {brands.map((brand) => (
            <OptionCard
              key={brand.id}
              name="brand"
              value={brand.id}
              checked={state.food.mode === "catalog" && state.food.brandId === brand.id}
              onChange={() => dispatch({ type: "select-brand", brandId: brand.id })}
              title={brand.name}
              invalid={Boolean(errors.food)}
            />
          ))}
          <OptionCard
            name="brand"
            value="custom"
            checked={state.food.mode === "custom"}
            onChange={() => dispatch({ type: "set-food-mode", mode: "custom" })}
            title="Otra marca"
            description="No encuentro su alimento"
            icon={<MagnifyingGlass size={24} weight="bold" />}
            invalid={Boolean(errors.food)}
          />
        </div>
      </fieldset>

      {state.food.mode === "catalog" && selectedBrand ? (
        <fieldset className="mt-7">
          <legend className="mb-3 font-semibold">Producto o línea</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedBrand.lines.map((line) => (
              <OptionCard
                key={line.id}
                name="line"
                value={line.id}
                checked={state.food.lineId === line.id}
                onChange={() => dispatch({ type: "select-line", lineId: line.id })}
                title={line.name}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {state.food.mode === "catalog" && selectedLine ? (
        <fieldset className="mt-7">
          <legend className="mb-3 font-semibold">Presentación que compra hoy</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {selectedLine.presentations.map((presentation) => (
              <OptionCard
                key={presentation.id}
                name="presentation"
                value={presentation.id}
                checked={state.food.presentationId === presentation.id}
                onChange={() =>
                  dispatch({
                    type: "select-presentation",
                    presentationId: presentation.id,
                  })
                }
                title={presentation.label}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {state.food.mode === "custom" ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="custom-brand" className="font-semibold">
              Marca
            </label>
            <input
              id="custom-brand"
              name="customBrand"
              autoComplete="off"
              value={state.food.customBrand}
              onChange={(event) =>
                dispatch({
                  type: "update-custom-food",
                  value: { customBrand: event.target.value },
                })
              }
              className={inputClass}
              aria-invalid={Boolean(errors.customBrand)}
              aria-describedby={errors.customBrand ? "custom-brand-error" : undefined}
              placeholder="Ej.: Vitalcan…"
            />
            {errors.customBrand ? (
              <p id="custom-brand-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                {errors.customBrand}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="custom-line" className="font-semibold">
              Producto o línea
            </label>
            <input
              id="custom-line"
              name="customLine"
              autoComplete="off"
              value={state.food.customLine}
              onChange={(event) =>
                dispatch({
                  type: "update-custom-food",
                  value: { customLine: event.target.value },
                })
              }
              className={inputClass}
              aria-invalid={Boolean(errors.customLine)}
              aria-describedby={errors.customLine ? "custom-line-error" : undefined}
              placeholder="Ej.: Adulto…"
            />
            {errors.customLine ? (
              <p id="custom-line-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                {errors.customLine}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="custom-presentation" className="font-semibold">
              Peso de la bolsa actual
            </label>
            <div className="relative">
              <input
                id="custom-presentation"
                name="customPresentation"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={state.food.customPresentationKg}
                onChange={(event) =>
                  dispatch({
                    type: "update-custom-food",
                    value: { customPresentationKg: event.target.value },
                  })
                }
                className={`${inputClass} pr-11`}
                aria-invalid={Boolean(errors.customPresentationKg)}
                aria-describedby={
                  errors.customPresentationKg
                    ? "custom-presentation-error"
                    : undefined
                }
                placeholder="Ej.: 3…"
              />
              <span className="pointer-events-none absolute bottom-[1.05rem] right-4 text-sm text-muted">
                kg
              </span>
            </div>
            {errors.customPresentationKg ? (
              <p id="custom-presentation-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                {errors.customPresentationKg}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {errors.food ? (
        <p id="food-error" className="mt-3 text-sm font-semibold text-[#b42318]">
          {errors.food}
        </p>
      ) : null}
    </div>
  );
}
