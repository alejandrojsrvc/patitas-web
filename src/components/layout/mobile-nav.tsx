"use client";

import { List, MapPin, UserCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const categoryLinks = [
  ["Alimento para perros", "/perros/alimentos-balanceados"],
  ["Alimento para gatos", "/gatos/alimentos-balanceados"],
  ["Snacks y premios", "/perros/snacks"],
  ["Arena e higiene", "/gatos/higiene"],
] as const;

export function MobileNav({
  displayName,
  displayAddress,
  replenishmentHref,
  replenishmentLabel,
  currentPath,
  sessionStatus = "ready",
  onSessionRetry,
  onBrand = false,
}: {
  displayName: string | null;
  displayAddress: string | null;
  replenishmentHref: string;
  replenishmentLabel: string;
  currentPath: string | null;
  sessionStatus?: "loading" | "ready" | "error";
  onSessionRetry?: () => void;
  onBrand?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key === "Tab") {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) closeMenu();
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus({ preventScroll: true }),
    );
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeMenu, isOpen]);

  const links = [
    ["Perros", "/perros"],
    ["Gatos", "/gatos"],
    ["Marcas", "/marcas"],
    ["Calculadora", "/calculadora-alimento"],
    [replenishmentLabel, replenishmentHref],
    ["Envíos", "/envios"],
    ["Preguntas frecuentes", "/preguntas-frecuentes"],
  ] as const;

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        className={`touch-target flex items-center justify-center rounded-xl ${onBrand ? "text-white hover:bg-white/10" : "text-ink hover:bg-catalog-soft"}`}
      >
        {isOpen ? <X size={22} weight="bold" /> : <List size={23} weight="bold" />}
      </button>
      {isOpen ? (
        <div
          ref={panelRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
          className="absolute inset-x-0 top-full z-50 max-h-[calc(100svh-8.25rem)] overflow-y-auto bg-catalog-canvas px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_16px_32px_rgba(23,23,23,0.16)] sm:px-4"
        >
          <Link
            href="/mi-cuenta"
            onClick={() => setIsOpen(false)}
            className="mb-2 flex items-center gap-3 rounded-xl bg-soft-blue px-3 py-2.5"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-yellow text-ink">
              <UserCircle size={22} weight="bold" />
            </span>
            <span className="min-w-0">
              {sessionStatus === "loading" ? (
                <>
                  <span className="block truncate text-sm font-semibold text-ink">Cargando tu cuenta…</span>
                  <span className="block text-xs text-muted">Actualizando tus datos</span>
                </>
              ) : sessionStatus === "error" ? (
                <>
                  <span className="block truncate text-sm font-semibold text-ink">No pudimos actualizar tu cuenta</span>
                  <span className="block text-xs text-muted">Intentá nuevamente más tarde</span>
                </>
              ) : displayName ? (
                <>
                  <span className="block truncate text-sm font-semibold text-ink">{displayName}</span>
                  <span className="block text-xs text-muted">Mi cuenta</span>
                </>
              ) : (
                <>
                  <span className="block text-sm font-semibold text-ink">Ingresá</span>
                  <span className="block text-xs text-muted">Mi cuenta</span>
                </>
              )}
            </span>
          </Link>

          <Link
            href="/mi-cuenta/direcciones"
            onClick={() => setIsOpen(false)}
            className="mb-3 flex min-h-12 items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-ink"
          >
            <MapPin size={21} weight="bold" className="shrink-0 text-brand-blue" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-xs text-muted">Tu dirección</span>
              <span className="block truncate text-sm font-semibold">
                {sessionStatus === "loading"
                  ? "Cargando…"
                  : sessionStatus === "error"
                    ? "No disponible"
                    : (displayAddress ?? "Elegí tu dirección")}
              </span>
            </span>
          </Link>
          {sessionStatus === "error" && onSessionRetry ? (
            <button
              type="button"
              onClick={onSessionRetry}
              className="mb-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-catalog-line bg-white px-3 py-2.5 text-sm font-semibold text-brand-blue hover:bg-soft-blue"
            >
              Reintentar actualización
            </button>
          ) : null}

          <nav aria-label="Navegación mobile" className="grid gap-1">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                scroll={!isCatalogPath(href)}
                aria-current={isCurrentPath(currentPath, href) ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-3 py-2.5 font-semibold text-ink hover:bg-soft-blue hover:text-brand-blue"
              >
                {label}
              </Link>
            ))}

            <div className="mt-2 border-t border-catalog-line pt-2">
              <span className="px-3 text-xs font-semibold text-muted">Categorías</span>
              <div className="mt-1 grid grid-cols-2 gap-1">
                {categoryLinks.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    scroll={false}
                    aria-current={isCurrentPath(currentPath, href) ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className="flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-soft-blue hover:text-brand-blue"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/contacto"
              onClick={() => setIsOpen(false)}
              className="mt-2 flex min-h-12 items-center rounded-xl bg-brand-blue px-3 py-3 font-semibold text-white"
            >
              Contacto
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function isCurrentPath(pathname: string | null, href: string) {
  if (!pathname || href.includes("#")) return false;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function isCatalogPath(href: string) {
  return ["/perros", "/gatos", "/marcas", "/buscar"].some((path) => href === path || href.startsWith(`${path}/`));
}
