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
import { cloudflareImageUrl } from "@/lib/cloudflare-image-url";

const navItems = [
  {
    label: "Perros",
    href: "/perros",
    groups: [
      {
        label: "Alimentos",
        links: [
          ["Alimentos balanceados", "/perros/alimentos-balanceados"],
          ["Alimentos húmedos", "/perros/alimentos-humedos"],
        ],
      },
      {
        label: "Premios y complementos",
        links: [["Snacks y premios", "/perros/snacks"]],
      },
      {
        label: "Higiene y paseo",
        links: [
          ["Ver higiene y paseo", "/perros/higiene"],
          ["Bolsitas para perros", "/perros/higiene/bolsas"],
        ],
      },
    ] as const,
  },
  {
    label: "Gatos",
    href: "/gatos",
    groups: [
      {
        label: "Alimentos",
        links: [
          ["Alimentos balanceados", "/gatos/alimentos-balanceados"],
          ["Alimentos húmedos", "/gatos/alimentos-humedos"],
        ],
      },
      {
        label: "Premios y complementos",
        links: [["Snacks y premios", "/gatos/snacks"]],
      },
      {
        label: "Higiene",
        links: [
          ["Ver arena e higiene", "/gatos/higiene"],
          ["Arena para gatos", "/gatos/higiene/arena"],
        ],
      },
    ] as const,
  },
  { label: "Marcas", href: "/marcas" },
  { label: "Calculadora", href: "/calculadora-alimento" },
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
  const replenishmentLabel = effectiveShell.viewer.authenticated ? "Mis reposiciones" : "Reponer";

  return (
    <HeaderSearchProvider key={searchQuery ?? ""} initialQuery={searchQuery}>
      <header className="sticky top-0 z-40 bg-brand-blue text-white lg:relative">
        <div className="container-shell flex min-h-[4.5rem] items-center gap-3 py-2 sm:gap-5 lg:h-20 lg:min-h-0 lg:gap-6 lg:py-0">
          <Link href="/" aria-label="Patitas Inquietas, ir al inicio" translate="no" className="shrink-0">
            <Image
              src={cloudflareImageUrl("/brand/patitas-logo-horizontal.png", { width: 448, quality: 85 })}
              alt="Patitas Inquietas"
              width={220}
              height={24}
              unoptimized
              priority
              quality={60}
              sizes="(min-width: 1024px) 164px, 142px"
              className="h-auto w-[136px] brightness-0 invert sm:w-[148px] lg:w-[164px]"
            />
          </Link>

          {!minimal ? (
            <Link
              href="/mi-cuenta/direcciones"
              className="hidden min-w-0 max-w-44 shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-white hover:bg-white/10 lg:inline-flex"
            >
              <MapPin size={22} weight="bold" className="shrink-0 text-brand-yellow" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-[11px] leading-tight text-white">Tu dirección</span>
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
              className="inline-flex min-w-0 max-w-40 items-center gap-2 rounded-xl px-2.5 py-2 text-white hover:bg-white/10"
            >
              <UserCircle size={23} weight="bold" className="shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold leading-tight">
                  {sessionPending ? "Cargando…" : sessionError && !sessionShell?.shell ? "No disponible" : (displayName ?? "Ingresá")}
                </span>
                <span className="block text-xs leading-tight text-white">Mi cuenta</span>
              </span>
            </Link>
            {sessionError && sessionShell?.retry ? (
              <button
                type="button"
                onClick={sessionShell.retry}
                className="rounded-lg px-2 py-2 text-[11px] font-semibold text-brand-yellow hover:bg-white/10"
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
            <nav aria-label="Categorías" className="hidden lg:block">
              <div className="container-shell flex h-11 items-center gap-1 text-[13px] font-semibold">
                <Link
                  href="/perros"
                  scroll={false}
                  className="mr-2 inline-flex h-8 items-center rounded-lg bg-brand-yellow px-3 text-ink hover:bg-[#f1df00]"
                >
                  Catálogo
                </Link>
                {navItems.map((item) => (
                  <NavItem key={item.href} item={item} currentPath={pathname} />
                ))}
                <Link
                  href={replenishmentHref}
                  aria-current={isCurrentPath(pathname, replenishmentHref) ? "page" : undefined}
                  className="whitespace-nowrap px-3 py-2 text-white hover:text-brand-yellow"
                >
                  {replenishmentLabel}
                </Link>
                <div className="ml-auto flex items-center gap-1 border-l border-white/20 pl-3">
                  <Link
                    href="/envios"
                    aria-current={isCurrentPath(pathname, "/envios") ? "page" : undefined}
                    className="whitespace-nowrap px-3 py-2 text-white hover:text-brand-yellow"
                  >
                    Envíos
                  </Link>
                  <Link
                    href="/preguntas-frecuentes"
                    aria-current={isCurrentPath(pathname, "/preguntas-frecuentes") ? "page" : undefined}
                    className="whitespace-nowrap px-3 py-2 text-white hover:text-brand-yellow"
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
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
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
        className="whitespace-nowrap px-3 py-2 text-white hover:text-brand-yellow"
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
            const menuItems = navRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
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
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-current={isCurrentPath(currentPath, item.href) ? "page" : undefined}
        className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-white hover:text-brand-yellow"
      >
        {item.label}
        <CaretDown size={14} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </Link>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={`${item.label}: categorías`}
          aria-labelledby={`${menuId}-trigger`}
          className="absolute left-0 top-full z-50 w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-catalog-line bg-white p-3 text-ink shadow-[0_20px_48px_rgba(23,23,23,0.16)]"
        >
          <div className="mb-2 flex items-center justify-between gap-4 border-b border-catalog-line px-2 pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Comprar para</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">{item.label}</p>
            </div>
            <MenuLink
              href={item.href}
              label="Ver todo"
              currentPath={currentPath}
              onNavigate={() => setOpen(false)}
              onEscape={() => {
                setOpen(false);
                focusTrigger();
              }}
              featured
            />
          </div>
          <div className="grid grid-cols-2 gap-3 px-1 pb-1">
            {item.groups.map((group) => (
              <div key={group.label} className="min-w-0">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{group.label}</p>
                <div role="group" aria-label={group.label}>
                  {group.links.map(([label, href]) => (
                    <MenuLink
                      key={href}
                      href={href}
                      label={label}
                      currentPath={currentPath}
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
  featured = false,
}: {
  href: string;
  label: string;
  currentPath: string | null;
  onNavigate?: () => void;
  onEscape?: () => void;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={!isCatalogPath(href)}
      role="menuitem"
      aria-current={isCurrentPath(currentPath, href) ? "page" : undefined}
      onClick={onNavigate}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          const menu = event.currentTarget.closest('[role="menu"]');
          const menuItems = menu?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
          if (!menuItems?.length) return;
          const index = Array.from(menuItems).indexOf(event.currentTarget);
          const nextIndex = event.key === "ArrowDown" ? (index + 1) % menuItems.length : (index - 1 + menuItems.length) % menuItems.length;
          menuItems[nextIndex]?.focus({ preventScroll: true });
        } else if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onEscape?.();
        }
      }}
      className={`flex min-h-10 items-center rounded-lg px-2.5 py-2 text-sm transition-colors ${
        featured
          ? "bg-soft-blue font-semibold text-brand-blue hover:bg-brand-blue hover:text-white"
          : "text-ink hover:bg-soft-blue hover:text-brand-blue"
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
