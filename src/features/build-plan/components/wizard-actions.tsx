import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

type WizardActionsProps = {
  canGoBack: boolean;
  onBack: () => void;
  nextLabel?: string;
};

export function WizardActions({ canGoBack, onBack, nextLabel = "Continuar" }: WizardActionsProps) {
  return (
    <div className="mt-auto border-t border-border bg-page-bg pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
      <div className="flex gap-3">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 font-semibold text-ink transition-colors hover:border-brand-blue hover:text-brand-blue"
          >
            <ArrowLeft size={18} weight="bold" aria-hidden="true" />
            Atrás
          </button>
        ) : null}
        <button
          type="submit"
          className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white transition-colors hover:bg-[#0048dc] active:bg-[#003fbe]"
        >
          {nextLabel}
          <ArrowRight size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
