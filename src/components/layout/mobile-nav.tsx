"use client";

import { List, MapPin, UserCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const links = [
  ["Perros", "/perros"],
  ["Gatos", "/gatos"],
  ["Marcas", "/marcas"],
  ["Calculadora", "/calculadora-alimento"],
  ["Preguntas frecuentes", "/#preguntas-frecuentes"],
] as const;

const categoryLinks = [
  ["Alimentos", "/perros/alimentos"],
  ["Snacks", "/perros/snacks"],
  ["Arena", "/gatos/arena"],
  ["Juguetes", "/buscar"],
  ["Paseo", "/perros/bolsas"],
] as const;

export function MobileNav({ displayName, displayAddress }: { displayName: string | null; displayAddress: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button ref={triggerRef} type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-controls="mobile-menu" aria-label={isOpen ? "Cerrar menú" : "Abrir menú"} className="touch-target flex items-center justify-center rounded-xl text-ink hover:bg-catalog-soft">
        {isOpen ? <X size={22} weight="bold" /> : <List size={23} weight="bold" />}
      </button>
      {isOpen ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-full max-h-[calc(100svh-8.25rem)] overflow-y-auto border-b border-catalog-line bg-catalog-canvas px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-4">
          <Link href="/mi-cuenta" onClick={() => setIsOpen(false)} className="mb-2 flex items-center gap-3 rounded-xl bg-soft-blue px-3 py-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-yellow text-ink">
              <UserCircle size={22} weight="bold" />
            </span>
            <span className="min-w-0">
              {displayName ? (
                <>
                  <span className="block truncate text-sm font-semibold text-ink">{displayName}</span>
                  <span className="block text-xs text-muted">Mi cuenta</span>
                </>
              ) : (
                <><span className="block text-sm font-semibold text-ink">Ingresá</span><span className="block text-xs text-muted">Mi cuenta</span></>
              )}
            </span>
          </Link>

          <Link href="/mi-cuenta/direcciones" onClick={() => setIsOpen(false)} className="mb-3 flex min-h-12 items-center gap-3 rounded-xl border border-catalog-line bg-white px-3 py-2.5 text-ink">
            <MapPin size={21} weight="bold" className="shrink-0 text-brand-blue" aria-hidden="true" />
            <span className="min-w-0"><span className="block text-xs text-muted">Tu dirección</span><span className="block truncate text-sm font-semibold">{displayAddress ?? "Elegí tu dirección"}</span></span>
          </Link>

          <nav aria-label="Navegación mobile" className="grid gap-1">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setIsOpen(false)} className="min-h-11 rounded-xl px-3 py-2.5 font-semibold text-ink hover:bg-soft-blue hover:text-brand-blue">{label}</Link>
            ))}

            <div className="mt-2 border-t border-catalog-line pt-2">
              <span className="px-3 text-xs font-semibold text-muted">Categorías</span>
              <div className="mt-1 grid grid-cols-2 gap-1">
                {categoryLinks.map(([label, href]) => (
                  <Link key={href} href={href} onClick={() => setIsOpen(false)} className="min-h-10 rounded-xl px-3 py-2 text-sm font-semibold text-ink hover:bg-soft-blue hover:text-brand-blue">{label}</Link>
                ))}
              </div>
            </div>

            <Link href="/contacto" onClick={() => setIsOpen(false)} className="mt-2 flex min-h-12 items-center rounded-xl bg-brand-blue px-3 py-3 font-semibold text-white">Contacto</Link>
            <Link href="/mi-cuenta" onClick={() => setIsOpen(false)} className="mt-1 flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ink"><UserCircle size={22} weight="bold" /> {displayName ? "Ver mi cuenta" : "Iniciar sesión"}</Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
