import { Cat, Dog } from "@phosphor-icons/react";
import { OptionCard } from "../option-card";
import { StepIntro } from "../step-intro";
import type { BuildPlanState, LifeStage } from "../../types";
import type { BuildPlanAction } from "../../hooks/use-build-plan";

type PetStepProps = {
  state: BuildPlanState;
  phase: 1 | 2 | 3;
  errors: Record<string, string>;
  updatePet: React.Dispatch<BuildPlanAction>;
};

const stages: Array<{ value: LifeStage; label: string; detail: string }> = [
  { value: "puppy", label: "Cachorro", detail: "Todavía está creciendo" },
  { value: "adult", label: "Adulto", detail: "Ya alcanzó su etapa adulta" },
  { value: "senior", label: "Senior", detail: "Está en una etapa más tranquila" },
];

export function PetStep({ state, phase, errors, updatePet }: PetStepProps) {
  return (
    <div>
      {phase === 1 ? (
        <>
          <StepIntro title="¿Para quién armamos esta Patitas?" description="Empecemos por lo esencial: ¿es perro o gato?" />
          <fieldset aria-describedby={errors.species ? "species-error" : undefined}>
            <legend className="sr-only">Tipo de mascota</legend>
            <div className="grid grid-cols-2 gap-3">
              <OptionCard
                name="species"
                value="dog"
                checked={state.pet.species === "dog"}
                onChange={() => updatePet({ type: "update-pet", value: { species: "dog" } })}
                title="Perro"
                icon={<Dog size={27} weight="duotone" />}
                invalid={Boolean(errors.species)}
              />
              <OptionCard
                name="species"
                value="cat"
                checked={state.pet.species === "cat"}
                onChange={() => updatePet({ type: "update-pet", value: { species: "cat" } })}
                title="Gato"
                icon={<Cat size={27} weight="duotone" />}
                invalid={Boolean(errors.species)}
              />
            </div>
            {errors.species ? (
              <p id="species-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                {errors.species}
              </p>
            ) : null}
          </fieldset>
        </>
      ) : null}

      {phase === 2 ? (
        <>
          <StepIntro title="¿Cómo se llama y cuánto pesa?" description="Con estos dos datos empezamos a personalizar su plan." />
          <div className="grid gap-5 sm:grid-cols-[1fr_11rem]">
            <div>
              <label htmlFor="pet-name" className="font-semibold">
                ¿Cómo se llama?
              </label>
              <input
                id="pet-name"
                name="petName"
                type="text"
                autoComplete="off"
                value={state.pet.name}
                onChange={(event) => updatePet({ type: "update-pet", value: { name: event.target.value } })}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "pet-name-error" : undefined}
                className="mt-2 h-14 w-full rounded-xl border border-[#d6d6d0] bg-surface px-4 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-[#85857f] focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(0,85,255,0.12)]"
                placeholder="Ej.: Kiara…"
              />
              {errors.name ? (
                <p id="pet-name-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                  {errors.name}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="pet-weight" className="font-semibold">
                Peso en kg
              </label>
              <div className="relative mt-2">
                <input
                  id="pet-weight"
                  name="petWeight"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={state.pet.weight}
                  onChange={(event) => updatePet({ type: "update-pet", value: { weight: event.target.value } })}
                  aria-invalid={Boolean(errors.weight)}
                  aria-describedby={errors.weight ? "pet-weight-error" : undefined}
                  className="h-14 w-full rounded-xl border border-[#d6d6d0] bg-surface px-4 pr-11 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-[#85857f] focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(0,85,255,0.12)]"
                  placeholder="Ej.: 11…"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">kg</span>
              </div>
              {errors.weight ? (
                <p id="pet-weight-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                  {errors.weight}
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {phase === 3 ? (
        <>
          <StepIntro title={`${state.pet.name}, ¿en qué etapa está?`} description="Elegí la opción que mejor describe su momento actual." />
          <fieldset aria-describedby={errors.lifeStage ? "stage-error" : undefined}>
            <legend className="sr-only">Etapa de vida</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {stages.map((stage) => (
                <OptionCard
                  key={stage.value}
                  name="lifeStage"
                  value={stage.value}
                  checked={state.pet.lifeStage === stage.value}
                  onChange={() => updatePet({ type: "update-pet", value: { lifeStage: stage.value } })}
                  title={stage.label}
                  description={stage.detail}
                  invalid={Boolean(errors.lifeStage)}
                />
              ))}
            </div>
            {errors.lifeStage ? (
              <p id="stage-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                {errors.lifeStage}
              </p>
            ) : null}
          </fieldset>
        </>
      ) : null}
    </div>
  );
}
