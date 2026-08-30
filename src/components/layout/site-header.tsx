"use client";

import { CaretDown, MagnifyingGlass, MapPin, UserCircle } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CartLink } from "@/features/cart/cart-link";
import { MobileNav } from "./mobile-nav";
import type { AuthUser } from "@/domain/auth/types";
import type { CustomerAddress, CustomerProfile } from "@/domain/customer/types";

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

type HeaderUser = {
  user: AuthUser;
  profile: CustomerProfile | null;
  defaultAddress: CustomerAddress | null;
};

export function SiteHeader({ searchQuery, minimal = false }: { searchQuery?: string; minimal?: boolean }) {
  const [headerUser, setHeaderUser] = useState<HeaderUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const authResponse = await fetch("/api/auth/me");
        if (!authResponse.ok) {
          if (!cancelled) setHeaderUser(null);
          return;
        }
        const auth = (await authResponse.json().catch(() => null)) as AuthUser | { message?: string } | null;
        if (!auth || !("id" in auth)) {
          if (!cancelled) setHeaderUser(null);
          return;
        }

        const [profileResult, addressesResult] = await Promise.all([
          fetch("/api/commerce/me/customer").then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch("/api/commerce/me/addresses").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        const profile = profileResult as CustomerProfile | null;
        const addresses = addressesResult as CustomerAddress[] | null;
        const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0] ?? null;

        if (!cancelled) {
          setHeaderUser({ user: auth, profile, defaultAddress });
        }
      } catch {
        if (!cancelled) setHeaderUser(null);
      }
    }

    void loadUser();

    function onAuthChanged() {
      void loadUser();
    }

    window.addEventListener("patitas-auth-changed", onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("patitas-auth-changed", onAuthChanged);
    };
  }, []);

  const displayName = headerUser?.profile?.fullName ?? headerUser?.user?.email ?? null;
  const displayAddress = headerUser?.defaultAddress
    ? `${headerUser.defaultAddress.street} ${headerUser.defaultAddress.number}`
    : null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-catalog-line bg-white shadow-[0_8px_24px_rgba(23,23,23,0.05)]">
        {!minimal ? (
          <div className="hidden bg-store-navy text-white md:block">
            <div className="container-shell flex h-7 items-center justify-between text-[11px] font-semibold tracking-[0.02em]">
              <p>Envíos en CABA</p>
              <div className="flex items-center gap-5 text-white/75">
                <Link href="/envios" className="hover:text-white">Cómo enviamos</Link>
                <Link href="/contacto" className="hover:text-white">Ayuda</Link>
              </div>
            </div>
          </div>
        ) : null}
        <div className="container-shell flex h-[4.25rem] items-center gap-3 sm:gap-5 lg:h-[4.5rem]">
          <Link href="/" aria-label="Patitas Inquietas, ir al inicio" translate="no" className="shrink-0">
            <Image src="/brand/patitas-logo-horizontal.png" alt="Patitas Inquietas" width={220} height={24} priority sizes="(min-width: 1024px) 164px, 142px" className="h-auto w-[136px] sm:w-[148px] lg:w-[164px]" />
          </Link>

          {!minimal ? (
            <form action="/buscar" className="mx-auto hidden w-full max-w-[32rem] lg:block">
              <label htmlFor="desktop-search" className="sr-only">Buscar productos</label>
              <div className="relative">
                <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input id="desktop-search" name="q" type="search" defaultValue={searchQuery} placeholder="Buscar alimento, marca o producto" className="h-11 w-full rounded-xl border border-catalog-line bg-catalog-soft pl-11 pr-4 text-sm text-ink placeholder:text-muted outline-none transition-colors focus:border-brand-blue focus:bg-white" />
              </div>
            </form>
          ) : null}

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link href="/mi-cuenta" aria-label="Mi cuenta" className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-ink hover:bg-catalog-soft">
              <UserCircle size={23} weight="bold" aria-hidden="true" />
              {displayName ? (
                <div className="hidden xl:block">
                  <span className="block truncate text-xs font-semibold leading-tight">{displayName}</span>
                  {displayAddress ? (
                    <span className="flex items-center gap-1 truncate text-[10px] leading-tight text-muted">
                      <MapPin size={10} aria-hidden="true" />
                      {displayAddress}
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="hidden xl:inline text-xs font-semibold">Mi cuenta</span>
              )}
            </Link>
            <CartLink />
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <CartLink />
            <MobileNav searchQuery={searchQuery} />
          </div>
        </div>
      </header>

      {!minimal ? (
        <nav aria-label="Categorías" className="hidden border-t border-catalog-line bg-white lg:block">
          <div className="container-shell flex h-10 items-center gap-1 text-[13px] font-semibold">
            <Link href="/buscar" className="mr-2 inline-flex h-7 items-center rounded-lg bg-brand-yellow px-3 text-ink hover:bg-[#f1df00]">Todos los productos</Link>
            {navItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </nav>
      ) : null}
    </>
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!("children" in item)) {
    return (
      <Link href={item.href} className="whitespace-nowrap px-3 py-2 text-ink hover:text-brand-blue">
        {item.label}
      </Link>
    );
  }

  return (
    <div
      ref={navRef}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
      onFocus={() => { cancelClose(); setOpen(true); }}
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
      <Link href={item.href} aria-expanded={open} aria-haspopup="menu" className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-ink hover:text-brand-blue">
        {item.label}
        <CaretDown size={14} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </Link>
      {open ? (
        <div className="absolute left-0 top-full z-50 min-w-[210px] rounded-xl bg-white p-2 shadow-[0_14px_36px_rgba(23,23,23,0.14)]">
          {item.children.map(([label, href]) => (
            <Link key={href} href={href} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ink hover:bg-soft-blue hover:text-brand-blue">
              {label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
