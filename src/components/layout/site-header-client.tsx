"use client";

import { CaretDown, MapPin, UserCircle } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { StorefrontShell } from "@/domain/storefront/types";
import { CartLink } from "@/features/cart/cart-link";
import { MobileNav } from "./mobile-nav";
import { useSessionShell } from "@/features/session/session-shell-context";
import { HeaderSearch, HeaderSearchProvider } from "./header-search";

const navItems = [
  {
    label: "Perros",
    href: "/perros",
    groups: [
      {
        label: "Alimento",
        links: [
          ["Alimento balanceado", "/perros/alimentos-balanceados"],
          ["Alimento húmedo", "/perros/alimentos-humedos"],
        ],
      },
      {
        label: "Premios, higiene y paseo",
        links: [
          ["Snacks y premios", "/perros/snacks"],
          ["Higiene y paseo para perros", "/perros/higiene"],
          ["Bolsitas para paseo", "/perros/higiene/bolsas"],
        ],
      },
    ] as const,
  },
  {
    label: "Gatos",
    href: "/gatos",
    groups: [
      {
        label: "Alimento",
        links: [
          ["Alimento balanceado", "/gatos/alimentos-balanceados"],
          ["Alimento húmedo", "/gatos/alimentos-humedos"],
        ],
      },
      {
        label: "Premios e higiene",
        links: [
          ["Snacks y premios", "/gatos/snacks"],
          ["Higiene para gatos", "/gatos/higiene"],
          ["Arena para gatos", "/gatos/higiene/arena"],
        ],
      },
    ] as const,
  },
  { label: "Marcas", href: "/marcas" },
  { label: "Calculadora de alimento", href: "/calculadora-alimento" },
] as const;

export function SiteHeaderClient({
  shell,
  searchQuery,
  minimal = false,
}: {
  shell: StorefrontShell;
  searchQuery?: string;
  minimal?: boolean;
}) {
  const sessionShell = useSessionShell();
  const pathname = usePathname();
  const effectiveShell = sessionShell?.shell ?? shell;
  const sessionPending = sessionShell?.status === "loading";
  const sessionError = sessionShell?.status === "error";
  const displayName = effectiveShell.viewer.authenticated ? effectiveShell.viewer.displayName || effectiveShell.viewer.email : null;
  const displayAddress = effectiveShell.location
    ? effectiveShell.location.label ||
      `${effectiveShell.location.street} ${effectiveShell.location.number}, ${effectiveShell.location.city}`
    : null;
  const replenishmentHref = effectiveShell.viewer.authenticated ? "/mi-cuenta/reposiciones" : "/reponer";
  const replenishmentLabel = effectiveShell.viewer.authenticated ? "Mis reposiciones" : "Organizar reposición";

  return (
    <HeaderSearchProvider key={searchQuery ?? ""} initialQuery={searchQuery}>
      <header className="sticky top-0 z-40 bg-brand-blue text-white lg:relative">
        <div className="container-shell flex min-h-[4.5rem] items-center gap-3 py-2 sm:gap-5 lg:h-20 lg:min-h-0 lg:gap-6 lg:py-0">
          <Link href="/" aria-label="Patitas Inquietas, ir al inicio" translate="no" className="shrink-0">
            <Image
              src="/brand/patitas-logo-horizontal.png"
              alt="Patitas Inquietas"
              width={220}
              height={24}
              unoptimized={false}
              priority
              quality={60}
              sizes="(min-width: 1024px) 164px, 142px"
              className="h-auto w-[136px] brightness-0 invert sm:w-[148px] lg:w-[164px]"
            />
          </Link>

          {!minimal ? (
            <Link
              href="/mi-cuenta/direcciones"
              className="hidden min-w-0 max-w-44 shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-white hover:bg-white/10 focus-visible:outline-brand-yellow lg:inline-flex"
            >
              <MapPin size={22} weight="bold" className="shrink-0 text-brand-yellow" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-xs leading-tight text-white">Tu dirección</span>
                <span className="block truncate text-xs font-semibold leading-tight">
                  {sessionPending
                    ? "Cargando…"
                    : sessionError && !sessionShell?.shell
                      ? "No disponible"
                      : (displayAddress ?? "Elegí tu dirección")}
                </span>
              </span>
            </Link>
          ) : null}

          {!minimal ? <HeaderSearch id="desktop-search" className="hidden min-w-0 flex-1 lg:block" /> : null}

          <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
            <Link
              href="/mi-cuenta"
              aria-label="Mi cuenta"
              className="inline-flex min-w-0 max-w-40 items-center gap-2 rounded-xl px-2.5 py-2 text-white hover:bg-white/10 focus-visible:outline-brand-yellow"
            >
              <UserCircle size={23} weight="bold" className="shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold leading-tight">
                  {sessionPending ? "Cargando…" : sessionError && !sessionShell?.shell ? "No disponible" : (displayName ?? "Ingresá")}
                </span>
                <span className="block text-xs leading-tight text-white">Mi cuenta</span>
              </span>
            </Link>
            {sessionError && sessionShell?.retry ? (
              <button
                type="button"
                onClick={sessionShell.retry}
                className="rounded-lg px-2 py-2 text-xs font-semibold text-brand-yellow hover:bg-white/10"
              >
                Reintentar
              </button>
            ) : null}
            <CartLink initialSummary={effectiveShell.cart} onBrand />
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <CartLink initialSummary={effectiveShell.cart} onBrand />
            {!minimal ? (
              <MobileNav
                displayName={displayName}
                displayAddress={displayAddress}
                replenishmentHref={replenishmentHref}
                replenishmentLabel={replenishmentLabel}
                currentPath={pathname}
                sessionStatus={sessionPending ? "loading" : sessionError ? "error" : "ready"}
                onSessionRetry={sessionShell?.retry}
                onBrand
              />
            ) : null}
          </div>
        </div>

        {!minimal ? (
          <>
            <HeaderSearch
              id="mobile-header-search"
              mobile
              className="container-shell relative border-t border-white/15 pb-3 pt-3 lg:hidden"
            />
            <nav aria-label="Navegación principal" className="hidden lg:block">
              <div className="container-shell flex h-11 items-center gap-1 text-sm font-semibold">
                {navItems.map((item) => (
                  <NavItem key={item.href} item={item} currentPath={pathname} />
                ))}
                <Link
                  href={replenishmentHref}
                  aria-current={isCurrentPath(pathname, replenishmentHref) ? "page" : undefined}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-white hover:text-brand-yellow focus-visible:outline-brand-yellow ${
                    isCurrentPath(pathname, replenishmentHref) ? "bg-white/10 text-brand-yellow" : ""
                  }`}
                >
                  {replenishmentLabel}
                </Link>
                <div className="ml-auto flex items-center gap-1 border-l border-white/20 pl-3">
                  <Link
                    href="/envios"
                    aria-current={isCurrentPath(pathname, "/envios") ? "page" : undefined}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-white hover:text-brand-yellow focus-visible:outline-brand-yellow ${
                      isCurrentPath(pathname, "/envios") ? "bg-white/10 text-brand-yellow" : ""
                    }`}
                  >
                    Envíos
                  </Link>
                  <Link
                    href="/preguntas-frecuentes"
                    aria-current={isCurrentPath(pathname, "/preguntas-frecuentes") ? "page" : undefined}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-white hover:text-brand-yellow focus-visible:outline-brand-yellow ${
                      isCurrentPath(pathname, "/preguntas-frecuentes") ? "bg-white/10 text-brand-yellow" : ""
                    }`}
                  >
                    Ayuda
                  </Link>
                </div>
              </div>
            </nav>
          </>
        ) : null}
      </header>
    </HeaderSearchProvider>
  );
}

function NavItem({ item, currentPath }: { item: (typeof navItems)[number]; currentPath: string | null }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const menuId = `menu-${item.href.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;

  function scheduleClose() {
    timeoutRef.current = setTimeout(() => setOpen(false), 180);
  }

  function cancelClose() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function focusTrigger() {
    navRef.current?.querySelector<HTMLAnchorElement>(`#${menuId}-trigger`)?.focus({ preventScroll: true });
  }

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  if (!("groups" in item)) {
    return (
      <Link
        href={item.href}
        scroll={!isCatalogPath(item.href)}
        aria-current={isCurrentPath(currentPath, item.href) ? "page" : undefined}
        className={`whitespace-nowrap rounded-lg px-3 py-2 text-white hover:text-brand-yellow focus-visible:outline-brand-yellow ${
          isCurrentPath(currentPath, item.href) ? "bg-white/10 text-brand-yellow" : ""
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      ref={navRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        cancelClose();
        setOpen(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          cancelClose();
          setOpen(true);
          window.requestAnimationFrame(() => {
            const menuItems = navRef.current?.querySelectorAll<HTMLAnchorElement>("[data-menu-link]");
            if (!menuItems?.length) return;
            menuItems[event.key === "ArrowDown" ? 0 : menuItems.length - 1]?.focus({ preventScroll: true });
          });
          return;
        }
        if (event.key === "Escape") {
          setOpen(false);
          focusTrigger();
        }
      }}
    >
      <Link
        id={`${menuId}-trigger`}
        href={item.href}
        scroll={!isCatalogPath(item.href)}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-current={isCurrentPath(currentPath, item.href) ? "page" : undefined}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-white hover:text-brand-yellow focus-visible:outline-brand-yellow ${
          isCurrentPath(currentPath, item.href) ? "bg-white/10 text-brand-yellow" : ""
        }`}
      >
        {item.label}
        <CaretDown size={14} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </Link>
      {open ? (
        <div
          id={menuId}
          role="group"
          aria-labelledby={`${menuId}-trigger`}
          className="absolute left-0 top-full z-50 w-[min(30rem,calc(100vw-2rem))] rounded-xl bg-white p-3 text-ink shadow-[0_14px_36px_rgba(23,23,23,0.14)]"
        >
          <div className="flex items-center justify-between gap-4 px-2 pb-2">
            <p className="text-base font-semibold text-ink">Comprar para {item.label.toLowerCase()}</p>
            <MenuLink
              href={item.href}
              label={`Ver todo para ${item.label.toLowerCase()}`}
              currentPath={currentPath}
              onNavigate={() => setOpen(false)}
              onEscape={() => {
                setOpen(false);
                focusTrigger();
              }}
              quiet
            />
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-catalog-soft p-2">
            {item.groups.map((group) => (
              <div key={group.label} className="min-w-0 px-1 py-1">
                <p className="px-2 pb-1.5 text-xs font-bold text-muted">{group.label}</p>
                <div role="group" aria-label={group.label}>
                  {group.links.map(([label, href]) => (
                    <MenuLink
                      key={href}
                      href={href}
                      label={label}
                      currentPath={currentPath}
                      onNavigate={() => setOpen(false)}
                      onEscape={() => {
                        setOpen(false);
                        focusTrigger();
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  label,
  currentPath,
  onNavigate,
  onEscape,
  quiet = false,
}: {
  href: string;
  label: string;
  currentPath: string | null;
  onNavigate?: () => void;
  onEscape?: () => void;
  quiet?: boolean;
}) {
  const current = isCurrentPath(currentPath, href);

  return (
    <Link
      href={href}
      scroll={!isCatalogPath(href)}
      data-menu-link
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
      onKeyDown={(event) => {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          const menu = event.currentTarget.closest<HTMLElement>("[aria-labelledby]");
          const menuItems = menu?.querySelectorAll<HTMLAnchorElement>("[data-menu-link]");
          if (!menuItems?.length) return;
          const index = Array.from(menuItems).indexOf(event.currentTarget);
          const nextIndex =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? menuItems.length - 1
                : event.key === "ArrowDown"
                  ? (index + 1) % menuItems.length
                  : (index - 1 + menuItems.length) % menuItems.length;
          menuItems[nextIndex]?.focus({ preventScroll: true });
        } else if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onEscape?.();
        }
      }}
      className={`flex min-h-11 items-center rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-brand-blue ${
        quiet
          ? "min-h-0 px-0 font-semibold text-brand-blue underline-offset-4 hover:underline"
          : current
            ? "bg-white font-semibold text-brand-blue"
            : "text-ink hover:bg-white hover:text-brand-blue"
      }`}
    >
      {label}
    </Link>
  );
}

function isCurrentPath(pathname: string | null, href: string) {
  if (!pathname || href.includes("#")) return false;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function isCatalogPath(href: string) {
  return ["/perros", "/gatos", "/marcas", "/buscar"].some((path) => href === path || href.startsWith(`${path}/`));
}
