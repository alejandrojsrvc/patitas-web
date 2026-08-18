type OptionCardProps = {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  invalid?: boolean;
};

export function OptionCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  icon,
  invalid = false,
}: OptionCardProps) {
  return (
    <label
      data-invalid={invalid || undefined}
      className={`flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-[background-color,border-color,box-shadow] focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-brand-yellow sm:p-5 ${
        checked
          ? "border-brand-blue bg-soft-blue shadow-[0_6px_18px_rgba(0,85,255,0.08)]"
          : "border-border bg-surface hover:border-[#b8c9eb]"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {icon ? (
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${checked ? "bg-brand-blue text-white" : "bg-soft-blue text-brand-blue"}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{title}</span>
        {description ? (
          <span className="mt-1 block text-sm text-muted">{description}</span>
        ) : null}
      </span>
      <span
        className={`size-5 shrink-0 rounded-full border-[5px] ${checked ? "border-brand-blue bg-surface" : "border-[#cfcfca] bg-surface"}`}
        aria-hidden="true"
      />
    </label>
  );
}
