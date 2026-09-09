import { ArrowRight } from "@phosphor-icons/react/ssr";

type CtaLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "yellow" | "ghost";
  className?: string;
};

const variants = {
  primary: "bg-brand-blue text-white hover:bg-[#0048dc] active:bg-[#003fbe]",
  secondary: "border border-[#dadaD5] bg-surface text-ink hover:border-brand-blue hover:text-brand-blue",
  yellow: "bg-brand-yellow text-ink hover:bg-[#f1df00] active:bg-[#e3d200]",
  ghost: "text-brand-blue underline-offset-4 hover:underline",
};

export function CtaLink({ href, children, variant = "primary", className = "" }: CtaLinkProps) {
  const isGhost = variant === "ghost";

  return (
    <a
      href={href}
      className={`${
        isGhost
          ? "inline-flex items-center gap-2 font-semibold"
          : "inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-center font-semibold"
      } transition-[background-color,border-color,color,transform] duration-200 ${variants[variant]} ${className}`}
    >
      <span>{children}</span>
      <ArrowRight size={18} weight="bold" aria-hidden="true" />
    </a>
  );
}
