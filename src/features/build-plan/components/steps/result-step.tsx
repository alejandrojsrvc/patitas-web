import {
  ArrowLeft,
  BowlFood,
  CalendarDots,
  Cat,
  CheckCircle,
  Dog,
  FloppyDisk,
} from "@phosphor-icons/react";
import type { FormEvent } from "react";
import type { BuildPlanAction } from "../../hooks/use-build-plan";
import type {
  BuildPlanState,
  ConsumableOption,
  PlanRecommendation,
} from "../../types";
import {
  formatConsumableQuantity,
  formatGrams,
  formatReplenishmentDate,
} from "../../utils/formatters";

type ResultStepProps = {
  state: BuildPlanState;
  recommendation: PlanRecommendation;
  consumables: ConsumableOption[];
  errors: Record<string, string>;
  dispatch: React.Dispatch<BuildPlanAction>;
  onEdit: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const inputClass =
  "mt-2 h-14 w-full rounded-xl border border-[#d6d6d0] bg-surface px-4 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-[#85857f] focus:border-brand-blue focus:shadow-[0_0_0_4px_rgba(0,85,255,0.12)]";

const lifeStageLabels = {
  puppy: "Cachorro",
  adult: "Adulto",
  senior: "Senior",
};

export function ResultStep({
  state,
  recommendation,
  consumables,
  errors,
  dispatch,
  onEdit,
  onSubmit,
}: ResultStepProps) {
  const PetIcon = state.pet.species === "cat" ? Cat : Dog;
  const selectedExtras = state.selectedConsumables.map((selection) => ({
    ...selection,
    option: consumables.find((option) => option.id === selection.id)!,
  }));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            data-step-heading
            tabIndex={-1}
            className="display-heading text-4xl outline-none sm:text-5xl"
          >
            La Patitas de {state.pet.name}
          </h1>
          <p className="body-copy mt-4 text-lg">
            Una propuesta inicial construida con lo que nos contaste.
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          disabled={state.submissionStatus === "submitting"}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-brand-blue transition-colors hover:border-brand-blue disabled:cursor-wait disabled:text-muted"
        >
          <ArrowLeft size={17} weight="bold" aria-hidden="true" />
          Editar
        </button>
      </div>

      <article className="mt-8 overflow-hidden rounded-[1.75rem] bg-surface shadow-[0_12px_32px_rgba(0,50,145,0.10)]">
        <div className="flex items-center justify-between gap-5 bg-brand-blue p-6 text-white sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/12 text-brand-yellow">
              <PetIcon size={34} weight="duotone" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-3xl font-semibold">{state.pet.name}</h2>
              <p className="mt-1 text-sm text-white/90">
                {state.pet.weight.replace(".", ",")} kg · {lifeStageLabels[state.pet.lifeStage!]}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-brand-yellow px-3 py-1.5 text-xs font-bold text-ink">
            PLAN INICIAL
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4 border-b border-border pb-6">
            <BowlFood size={30} weight="duotone" className="shrink-0 text-brand-blue" aria-hidden="true" />
            <div>
              <p className="font-display text-2xl font-semibold">{recommendation.foodName}</p>
              <p className="mt-1 text-lg font-semibold text-brand-blue">
                {recommendation.bagQuantity > 1
                  ? `${recommendation.bagQuantity} bolsas de `
                  : ""}
                {recommendation.presentation.label}
              </p>
            </div>
          </div>

          <dl className="grid gap-6 py-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-bold tracking-wide text-muted">CONSUMO APROXIMADO</dt>
              <dd className="mt-2 font-display text-2xl font-semibold">
                ≈ {formatGrams(recommendation.dailyConsumptionGrams)} g/día
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-wide text-muted">DURACIÓN ESTIMADA</dt>
              <dd className="mt-2 font-display text-2xl font-semibold">
                ≈ {Math.round(recommendation.estimatedDurationDays)} días
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-wide text-muted">RITMO PREFERIDO</dt>
              <dd className="mt-2 font-display text-2xl font-semibold">
                Cada {recommendation.periodDays} días
              </dd>
            </div>
          </dl>

          <div className="flex items-center gap-3 rounded-2xl bg-soft-yellow p-4">
            <CalendarDots size={24} weight="bold" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold tracking-wide">
                REPOSICIÓN ESTIMADA SEGÚN DURACIÓN
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {formatReplenishmentDate(recommendation.replenishmentDate)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="font-semibold">Otros esenciales</p>
            {selectedExtras.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {selectedExtras.map(({ option, quantity }) => (
                  <li key={option.id} className="flex items-center gap-2">
                    <CheckCircle size={18} weight="fill" className="text-brand-blue" aria-hidden="true" />
                    {option.name} · {formatConsumableQuantity(quantity, option.quantityLabel)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Sin complementos por ahora.</p>
            )}
          </div>
        </div>
      </article>

      <section className="mt-10 border-t border-border pt-9">
        <h2 className="display-heading text-3xl sm:text-4xl">
          Estamos preparando las primeras entregas de Patitas.
        </h2>
        <p className="body-copy mt-4 max-w-xl">
          Completá datos de prueba para ver cómo guardarías la Patitas de {state.pet.name}.
        </p>
        <p className="mt-4 rounded-xl bg-soft-yellow p-4 text-sm leading-6 text-ink">
          Modo demostración: tus datos no salen de este navegador ni quedan
          guardados cuando cerrás la sesión.
        </p>

        {state.submissionStatus === "success" ? (
          <div className="mt-6 rounded-2xl bg-soft-blue p-6" aria-live="polite">
            <CheckCircle size={34} weight="fill" className="text-brand-blue" aria-hidden="true" />
            <p className="mt-3 font-display text-2xl font-semibold">
              La Patitas de {state.pet.name} quedó preparada.
            </p>
            <p className="mt-2 text-sm text-muted">
              No enviamos información a ningún servidor. Podés seguir revisando
              este resultado mientras mantengas abierta la sesión.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="owner-name" className="font-semibold">
                Nombre del responsable
              </label>
              <input
                id="owner-name"
                name="ownerName"
                type="text"
                autoComplete="name"
                disabled={state.submissionStatus === "submitting"}
                value={state.lead.ownerName}
                onChange={(event) =>
                  dispatch({ type: "update-lead", value: { ownerName: event.target.value } })
                }
                aria-invalid={Boolean(errors.ownerName)}
                aria-describedby={errors.ownerName ? "owner-name-error" : undefined}
                className={inputClass}
                placeholder="Ej.: Martina…"
              />
              {errors.ownerName ? (
                <p id="owner-name-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                  {errors.ownerName}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="lead-email" className="font-semibold">
                Email
              </label>
              <input
                id="lead-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                disabled={state.submissionStatus === "submitting"}
                value={state.lead.email}
                onChange={(event) =>
                  dispatch({ type: "update-lead", value: { email: event.target.value } })
                }
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "lead-email-error" : undefined}
                className={inputClass}
                placeholder="vos@ejemplo.com…"
              />
              {errors.email ? (
                <p id="lead-email-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                  {errors.email}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="lead-whatsapp" className="font-semibold">
                WhatsApp <span className="font-normal text-muted">(opcional)</span>
              </label>
              <input
                id="lead-whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                disabled={state.submissionStatus === "submitting"}
                value={state.lead.whatsapp}
                onChange={(event) =>
                  dispatch({ type: "update-lead", value: { whatsapp: event.target.value } })
                }
                className={inputClass}
                placeholder="11 1234 5678…"
              />
            </div>
            <div>
              <label htmlFor="lead-neighborhood" className="font-semibold">
                Barrio o código postal
              </label>
              <input
                id="lead-neighborhood"
                name="neighborhood"
                type="text"
                autoComplete="postal-code"
                disabled={state.submissionStatus === "submitting"}
                value={state.lead.neighborhood}
                onChange={(event) =>
                  dispatch({
                    type: "update-lead",
                    value: { neighborhood: event.target.value },
                  })
                }
                aria-invalid={Boolean(errors.neighborhood)}
                aria-describedby={errors.neighborhood ? "neighborhood-error" : undefined}
                className={inputClass}
                placeholder="Ej.: Villa Crespo…"
              />
              {errors.neighborhood ? (
                <p id="neighborhood-error" className="mt-2 text-sm font-semibold text-[#b42318]">
                  {errors.neighborhood}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={state.submissionStatus === "submitting"}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-[#0048dc] disabled:cursor-wait disabled:bg-[#4b7fe8] sm:col-span-2"
            >
              <FloppyDisk size={20} weight="bold" aria-hidden="true" />
              {state.submissionStatus === "submitting"
                ? "Guardando…"
                : `Guardar la Patitas de ${state.pet.name}`}
            </button>
            {state.submissionStatus === "error" ? (
              <p className="text-sm font-semibold text-[#b42318] sm:col-span-2" aria-live="polite">
                No pudimos simular el guardado. Probá nuevamente.
              </p>
            ) : null}
          </form>
        )}
      </section>
    </div>
  );
}
