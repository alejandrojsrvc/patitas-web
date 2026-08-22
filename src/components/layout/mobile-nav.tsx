"use client";

import { List, MagnifyingGlass, UserCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const links = [
  ["Perros", "/perros"], ["Alimento para perros", "/perros/alimentos"],
  ["Gatos", "/gatos"], ["Alimento para gatos", "/gatos/alimentos"],
  ["Arena y piedras", "/gatos/arena"], ["Marcas", "/marcas"],
  ["Reponer", "/reponer"], ["Calcular alimento", "/calculadora-alimento"],
] as const;

export function MobileNav({ searchQuery }: { searchQuery?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setIsOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button ref={triggerRef} type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-controls="mobile-menu" aria-label={isOpen ? "Cerrar menú" : "Abrir menú"} className="touch-target flex items-center justify-center rounded-xl border border-border bg-white text-ink hover:border-brand-blue">
        {isOpen ? <X size={22} weight="bold" /> : <List size={23} weight="bold" />}
      </button>
      {isOpen ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] overflow-y-auto border-b border-black/5 bg-catalog-canvas px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_16px_40px_rgba(23,23,23,0.10)] sm:px-4">
          <form action="/buscar" className="relative mb-3 md:hidden">
            <label htmlFor="mobile-search" className="sr-only">Buscar productos</label>
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input id="mobile-search" name="q" type="search" defaultValue={searchQuery} placeholder="Buscar productos" className="h-12 w-full rounded-xl border border-transparent bg-white pl-11 pr-4 outline-none focus:border-brand-blue" />
          </form>
          <nav aria-label="Navegación mobile" className="grid gap-1">
            {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setIsOpen(false)} className="min-h-11 rounded-xl px-3 py-2.5 font-semibold text-ink hover:bg-soft-blue hover:text-brand-blue">{label}</Link>)}
            <Link href="/mi-cuenta" onClick={() => setIsOpen(false)} className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border-t border-border px-3 py-3 font-semibold text-ink"><UserCircle size={22} weight="bold" /> Mi cuenta</Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
