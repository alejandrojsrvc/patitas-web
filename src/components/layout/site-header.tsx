import Image from "next/image";
import { MobileNav } from "./mobile-nav";

const links = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#que-recibes", label: "Qué recibís" },
  { href: "#preguntas", label: "Preguntas" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-cream/95 backdrop-blur-md">
      <div className="container-shell flex h-18 items-center justify-between gap-6">
        <a href="#inicio" aria-label="Patitas Inquietas, ir al inicio" translate="no">
          <Image
            src="/brand/patitas-logo-horizontal.png"
            alt="Patitas Inquietas"
            width={220}
            height={24}
            loading="eager"
            className="h-auto w-[170px] sm:w-[190px]"
          />
        </a>

        <nav aria-label="Navegación principal" className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-ink transition-colors hover:text-brand-blue"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <span className="text-sm text-muted" title="Próximamente">
            Entrar
          </span>
          <a
            href="/armar"
            className="flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0048dc]"
          >
            Armar mi Patitas
          </a>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
