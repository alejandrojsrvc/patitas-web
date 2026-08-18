"use client";

import { List, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#que-recibes", label: "Qué recibís" },
  { href: "#preguntas", label: "Preguntas" },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-ink transition-[background-color,border-color] hover:border-brand-blue hover:bg-soft-blue"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? (
          <X size={22} weight="bold" aria-hidden="true" />
        ) : (
          <List size={24} weight="bold" aria-hidden="true" />
        )}
      </button>

      {isOpen ? (
        <nav
          id="mobile-menu"
          aria-label="Navegación mobile"
          className="absolute inset-x-4 top-[4.75rem] rounded-2xl border border-border bg-surface p-4 shadow-[0_12px_32px_rgba(23,23,23,0.10)]"
        >
          <div className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 font-semibold text-ink transition-colors hover:bg-soft-blue hover:text-brand-blue"
              >
                {link.label}
              </a>
            ))}
            <span className="px-3 py-3 text-muted" title="Próximamente">
              Entrar · Próximamente
            </span>
            <a
              href="#armar"
              onClick={closeMenu}
              className="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-[#0048dc]"
            >
              Armar mi Patitas
            </a>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
