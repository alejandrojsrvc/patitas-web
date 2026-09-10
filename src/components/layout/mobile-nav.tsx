"use client";

import { List, MapPin, UserCircle, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const shoppingGroups = [
  {
    label: "Perros",
    href: "/perros",
    links: [
      ["Alimento balanceado", "/perros/alimentos-balanceados"],
      ["Snacks y premios", "/perros/snacks"],
    ],
  },
  {
    label: "Gatos",
    href: "/gatos",
    links: [
      ["Alimento balanceado", "/gatos/alimentos-balanceados"],
      ["Arena e higiene", "/gatos/higiene"],
    ],
  },
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
    ["Marcas", "/marcas"],
    ["Calculadora de alimento", "/calculadora-alimento"],
    [replenishmentLabel, replenishmentHref],
    ["Envíos", "/envios"],
    ["Ayuda", "/preguntas-frecuentes"],
    ["Contacto", "/contacto"],
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
        className={`touch-target flex items-center justify-center rounded-xl ${
          onBrand
            ? "text-white hover:bg-white/10 focus-visible:outline-brand-yellow"
            : "text-ink hover:bg-catalog-soft focus-visible:outline-brand-blue"
        }`}
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
                  <span className="block truncate text-sm font-semibold text-ink">No pudimos cargar tus datos</span>
                  <span className="block text-xs text-muted">Podés reintentar ahora</span>
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
              Reintentar
            </button>
          ) : null}

          <nav aria-label="Navegación principal" className="grid gap-1">
            <div className="rounded-xl bg-white p-2">
              <p className="px-2 pb-1 text-base font-semibold text-ink">Comprar</p>
              <div className="grid grid-cols-2 gap-2">
                {shoppingGroups.map((group) => (
                  <div key={group.href} className="min-w-0 rounded-lg bg-catalog-soft p-1">
                    <Link
                      href={group.href}
                      scroll={false}
                      aria-current={isCurrentPath(currentPath, group.href) ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                      className={`flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold ${
                        isCurrentPath(currentPath, group.href) ? "bg-white text-brand-blue" : "text-ink hover:bg-white hover:text-brand-blue"
                      }`}
                    >
                      {group.label}
                    </Link>
                    {group.links.map(([label, href]) => (
                      <Link
                        key={href}
                        href={href}
                        scroll={false}
                        aria-current={isCurrentPath(currentPath, href) ? "page" : undefined}
                        onClick={() => setIsOpen(false)}
                        className={`flex min-h-11 items-center rounded-lg px-2 py-2 text-sm leading-5 ${
                          isCurrentPath(currentPath, href)
                            ? "bg-white font-semibold text-brand-blue"
                            : "text-ink hover:bg-white hover:text-brand-blue"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 border-t border-catalog-line pt-2">
              {links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  scroll={!isCatalogPath(href)}
                  aria-current={isCurrentPath(currentPath, href) ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-semibold ${
                    isCurrentPath(currentPath, href) ? "bg-soft-blue text-brand-blue" : "text-ink hover:bg-soft-blue hover:text-brand-blue"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
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
