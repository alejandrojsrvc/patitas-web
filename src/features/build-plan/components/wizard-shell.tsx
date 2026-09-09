import type { WizardStep } from "../types";

const stepLabels = ["Mascota", "Alimento", "Consumo", "Ritmo", "Presentación", "Esenciales", "Tu Patitas"];

type WizardShellProps = {
  step: WizardStep;
  children: React.ReactNode;
};

export function WizardShell({ step, children }: WizardShellProps) {
  return (
    <div className="container-shell min-h-[calc(100svh-4.5rem)] py-6 sm:py-8 lg:py-10">
      <section className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-4xl flex-col">
        <div className="mb-8 rounded-2xl bg-soft-blue p-4 sm:p-5">
          <div className="flex items-center justify-between gap-5 text-sm font-semibold">
            <span>Paso {step} de 7</span>
            <span className="text-muted">{stepLabels[step - 1]}</span>
          </div>
          <ol className="mt-3 grid grid-cols-7 gap-1.5" aria-label="Progreso">
            {stepLabels.map((label, index) => {
              const number = index + 1;
              return (
                <li key={label} aria-current={number === step ? "step" : undefined} className="min-w-0">
                  <span className={`block h-1.5 rounded-full ${number <= step ? "bg-brand-blue" : "bg-[#cdd8eb]"}`} aria-hidden="true" />
                  <span className="sr-only">{label}</span>
                </li>
              );
            })}
          </ol>
        </div>
        {children}
      </section>
    </div>
  );
}
