"use client";

import { CaretDown, MagnifyingGlass, MapPin, UserCircle } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { StorefrontShell } from "@/domain/storefront/types";
import { CartLink } from "@/features/cart/cart-link";
import { MobileNav } from "./mobile-nav";
import { useSessionShell } from "@/features/session/session-shell-context";

const navItems = [
  {
    label: "Perros",
    href: "/perros",
    children: [
      ["Ver todo", "/perros"],
      ["Alimentos", "/perros/alimentos"],
      ["Snacks", "/perros/snacks"],
      ["Bolsas para paseo", "/perros/bolsas"],
    ] as const,
  },
  {
    label: "Gatos",
    href: "/gatos",
    children: [
      ["Ver todo", "/gatos"],
      ["Alimentos", "/gatos/alimentos"],
      ["Arena y piedras", "/gatos/arena"],
      ["Snacks", "/gatos/snacks"],
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
  const effectiveShell = sessionShell ?? shell;
  const displayName = effectiveShell.viewer.authenticated ? effectiveShell.viewer.displayName || effectiveShell.viewer.email : null;
  const displayAddress = effectiveShell.location ? `${effectiveShell.location.street} ${effectiveShell.location.number}` : null;

  return (
    <header className="relative z-40 bg-brand-blue text-white">
      <div className="container-shell flex h-[4.25rem] items-center gap-3 sm:gap-5 lg:h-20 lg:gap-6">
        <Link href="/" aria-label="Patitas Inquietas, ir al inicio" translate="no" className="shrink-0">
          <Image
            src="/brand/patitas-logo-horizontal.png"
            alt="Patitas Inquietas"
            width={220}
            height={24}
            unoptimized={false}
            priority
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
              <span className="block truncate text-xs font-semibold leading-tight">{displayAddress ?? "Elegí tu dirección"}</span>
            </span>
          </Link>
        ) : null}

        {!minimal ? (
          <form action="/buscar" className="hidden min-w-0 flex-1 lg:block">
            <label htmlFor="desktop-search" className="sr-only">
              Buscar productos
            </label>
            <div className="relative">
              <MagnifyingGlass
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-blue"
                aria-hidden="true"
              />
              <input
                id="desktop-search"
                name="q"
                type="search"
                defaultValue={searchQuery}
                placeholder="Buscar alimento, marca o producto"
                className="h-12 w-full rounded-xl bg-white pl-11 pr-4 text-sm text-ink placeholder:text-muted outline-none transition-shadow focus:ring-2 focus:ring-brand-yellow"
              />
            </div>
          </form>
        ) : null}

        <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
          <Link
            href="/mi-cuenta"
            aria-label="Mi cuenta"
            className="inline-flex min-w-0 max-w-40 items-center gap-2 rounded-xl px-2.5 py-2 text-white hover:bg-white/10"
          >
            <UserCircle size={23} weight="bold" className="shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-semibold leading-tight">{displayName ?? "Ingresá"}</span>
              <span className="block text-xs leading-tight text-white">Mi cuenta</span>
            </span>
          </Link>
          <CartLink initialSummary={effectiveShell.cart} onBrand />
        </div>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <CartLink initialSummary={effectiveShell.cart} onBrand />
          {!minimal ? <MobileNav displayName={displayName} displayAddress={displayAddress} onBrand /> : null}
        </div>
      </div>

      {!minimal ? (
        <>
          <form action="/buscar" className="container-shell relative mb-3 lg:hidden">
            <label htmlFor="mobile-header-search" className="sr-only">
              Buscar productos
            </label>
            <MagnifyingGlass
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-blue"
              aria-hidden="true"
            />
            <input
              id="mobile-header-search"
              name="q"
              type="search"
              defaultValue={searchQuery}
              placeholder="Buscar alimento, marca o producto"
              className="h-12 w-full rounded-xl bg-white pl-11 pr-4 text-sm text-ink placeholder:text-muted outline-none transition-shadow focus:ring-2 focus:ring-brand-yellow"
            />
          </form>
          <nav aria-label="Categorías" className="hidden lg:block">
            <div className="container-shell flex h-11 items-center gap-1 text-[13px] font-semibold">
              <Link
                href="/buscar"
                className="mr-2 inline-flex h-8 items-center rounded-lg bg-brand-yellow px-3 text-ink hover:bg-[#f1df00]"
              >
                Todos los productos
              </Link>
              {navItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
              <div className="ml-auto flex items-center gap-1 border-l border-white/20 pl-3">
                <Link href="/envios" className="whitespace-nowrap px-3 py-2 text-white hover:text-brand-yellow">
                  Envíos
                </Link>
                <Link href="/preguntas-frecuentes" className="whitespace-nowrap px-3 py-2 text-white hover:text-brand-yellow">
                  Ayuda
                </Link>
              </div>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}

function NavItem({ item }: { item: (typeof navItems)[number] }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  function scheduleClose() {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  }

  function cancelClose() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  if (!("children" in item)) {
    return (
      <Link href={item.href} className="whitespace-nowrap px-3 py-2 text-white hover:text-brand-yellow">
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
        if (event.key === "Escape") {
          setOpen(false);
          navRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
        }
      }}
    >
      <Link
        href={item.href}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-white hover:text-brand-yellow"
      >
        {item.label}
        <CaretDown size={14} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </Link>
      {open ? (
        <div className="absolute left-0 top-full z-50 min-w-[210px] rounded-xl bg-white p-2 shadow-[0_14px_36px_rgba(23,23,23,0.14)]">
          {item.children.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ink hover:bg-soft-blue hover:text-brand-blue"
            >
              {label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
