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
        if (!authResponse.ok) return;
        const auth = (await authResponse.json().catch(() => null)) as AuthUser | { message?: string } | null;
        if (!auth || !("id" in auth)) return;

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
        // Silently ignore
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
      {/* Header principal */}
      <header className="sticky top-0 z-50 bg-brand-blue border-t border-white/10">
        <div className="container-shell relative flex h-16 items-center gap-2 sm:gap-3">
          <Link href="/" aria-label="Patitas Inquietas, ir al inicio" translate="no" className="shrink-0">
            <Image src="/brand/patitas-logo-horizontal.png" alt="Patitas Inquietas" width={220} height={24} priority sizes="(min-width: 1024px) 160px, 148px" className="h-auto w-[136px] brightness-0 invert sm:w-[148px] lg:w-40" />
          </Link>

          {!minimal ? (
            <form action="/buscar" className="absolute left-1/2 top-1/2 hidden w-[min(30vw,24rem)] -translate-x-1/2 -translate-y-1/2 lg:block">
              <label htmlFor="desktop-search" className="sr-only">Buscar productos</label>
              <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input id="desktop-search" name="q" type="search" defaultValue={searchQuery} placeholder="Buscar productos" className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm text-ink placeholder:text-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" />
            </form>
          ) : null}

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link href="/mi-cuenta" aria-label="Mi cuenta" className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-white hover:bg-white/15">
              <UserCircle size={23} weight="bold" aria-hidden="true" />
              {displayName ? (
                <div className="hidden xl:block">
                  <span className="block truncate text-xs font-semibold leading-tight">{displayName}</span>
                  {displayAddress ? (
                    <span className="flex items-center gap-1 truncate text-[10px] leading-tight text-white/70">
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

      {/* Línea 3: Categorías con dropdowns */}
      {!minimal ? (
        <nav aria-label="Categorías" className="hidden border-b border-border bg-white lg:block">
          <div className="container-shell flex items-center gap-1 py-0 text-sm font-semibold">
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
      <Link href={item.href} className="whitespace-nowrap px-3 py-2.5 text-muted hover:text-brand-blue hover:underline underline-offset-4">
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
    >
      <Link href={item.href} className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2.5 text-muted hover:text-brand-blue hover:underline underline-offset-4">
        {item.label}
        <CaretDown size={14} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </Link>
      {open ? (
        <div className="absolute left-0 top-full z-50 min-w-[200px] rounded-xl border border-border bg-white p-1.5 shadow-lg">
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
