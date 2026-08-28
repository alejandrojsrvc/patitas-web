"use client";

import { List, MagnifyingGlass, UserCircle, X, MapPin } from "@phosphor-icons/react";
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

export function MobileNav({ searchQuery }: { searchQuery?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [userName, setUserName] = useState<string | null>(null);

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

  useEffect(() => {
    async function loadUserName() {
      try {
        const authResponse = await fetch("/api/auth/me");
        if (!authResponse.ok) return;
        const auth = await authResponse.json().catch(() => null);
        if (!auth || !("id" in auth)) return;

        const profileResponse = await fetch("/api/commerce/me/customer");
        if (profileResponse.ok) {
          const profile = await profileResponse.json().catch(() => null);
          if (profile?.fullName) {
            setUserName(profile.fullName);
          }
        }
      } catch {
        // Silently ignore
      }
    }
    void loadUserName();
  }, []);

  return (
    <div className="lg:hidden">
      <button ref={triggerRef} type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-controls="mobile-menu" aria-label={isOpen ? "Cerrar menú" : "Abrir menú"} className="touch-target flex items-center justify-center rounded-xl text-white hover:bg-white/15">
        {isOpen ? <X size={22} weight="bold" /> : <List size={23} weight="bold" />}
      </button>
      {isOpen ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] overflow-y-auto border-b border-black/5 bg-catalog-canvas px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_16px_40px_rgba(23,23,23,0.10)] sm:px-4">
          <form action="/buscar" className="relative mb-3">
            <label htmlFor="mobile-search" className="sr-only">Buscar productos</label>
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input id="mobile-search" name="q" type="search" defaultValue={searchQuery} placeholder="Buscar alimento, marca o producto" className="h-12 w-full rounded-xl border border-transparent bg-white pl-11 pr-4 outline-none focus:border-brand-blue" />
          </form>

          <div className="mb-2 flex items-center gap-3 rounded-xl bg-soft-blue px-3 py-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-yellow text-ink">
              <UserCircle size={22} weight="bold" />
            </span>
            <span className="min-w-0">
              {userName ? (
                <>
                  <span className="block truncate text-sm font-semibold text-ink">{userName}</span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <MapPin size={12} aria-hidden="true" />
                    Mi cuenta
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-ink">Mi cuenta</span>
              )}
            </span>
          </div>

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
            <Link href="/mi-cuenta" onClick={() => setIsOpen(false)} className="mt-1 flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 font-semibold text-ink"><UserCircle size={22} weight="bold" /> {userName ? "Ver mi cuenta" : "Iniciar sesión"}</Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
