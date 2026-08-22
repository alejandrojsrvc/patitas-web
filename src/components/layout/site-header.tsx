import { MagnifyingGlass, UserCircle } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { CartLink } from "@/features/cart/cart-link";
import { MobileNav } from "./mobile-nav";

const petMenus = [
  {
    label: "Perros",
    href: "/perros",
    groups: [
      { title: "Alimento", links: [["Seco", "/perros/alimentos/secos"], ["Húmedo", "/perros/alimentos/humedos"], ["Snacks", "/perros/snacks"]] },
      { title: "Paseo", links: [["Bolsas", "/perros/bolsas"]] },
    ],
  },
  {
    label: "Gatos",
    href: "/gatos",
    groups: [
      { title: "Alimento", links: [["Seco", "/gatos/alimentos/secos"], ["Húmedo", "/gatos/alimentos/humedos"], ["Snacks", "/gatos/snacks"]] },
      { title: "Higiene", links: [["Arena y piedras", "/gatos/arena"]] },
    ],
  },
] as const;

export function SiteHeader({ searchQuery, minimal = false }: { searchQuery?: string; minimal?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95">
      <div className="container-shell flex min-h-16 items-center gap-2 sm:min-h-18 sm:gap-5">
        <Link href="/" aria-label="Patitas Inquietas, ir al inicio" translate="no" className="shrink-0">
          <Image src="/brand/patitas-logo-horizontal.png" alt="Patitas Inquietas" width={220} height={24} priority sizes="(min-width: 1280px) 190px, 142px" className="h-auto w-[142px] sm:w-[164px] xl:w-[190px]" />
        </Link>

        {minimal ? (
          <nav aria-label="Navegación principal" className="ml-auto hidden items-center gap-5 lg:flex">
            <Link href="/perros" className="text-sm font-semibold text-ink hover:text-brand-blue">Catálogo</Link>
            <Link href="/calculadora-alimento" className="text-sm font-semibold text-ink hover:text-brand-blue">Calculadora</Link>
            <Link href="#plan-quiz" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-[#0048dc]">Armar mi plan</Link>
            <CartLink />
          </nav>
        ) : (
        <nav aria-label="Navegación principal" className="hidden h-18 items-stretch lg:flex">
          {petMenus.map((menu) => (
            <div key={menu.href} className="group relative flex items-center">
              <Link href={menu.href} className="flex h-full items-center px-3 text-sm font-semibold text-ink hover:text-brand-blue">{menu.label}</Link>
              <div className="invisible absolute left-0 top-full w-[31rem] translate-y-1 rounded-b-2xl border border-border bg-white p-6 opacity-0 shadow-[0_16px_40px_rgba(23,23,23,0.10)] transition-[opacity,transform,visibility] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="grid grid-cols-2 gap-8">
                  {menu.groups.map((group) => (
                    <div key={group.title}>
                      <p className="font-display text-lg font-semibold">{group.title}</p>
                      <ul className="mt-3 space-y-2">
                        {group.links.map(([label, href]) => <li key={href}><Link href={href} className="text-sm text-muted underline-offset-4 hover:text-brand-blue hover:underline">{label}</Link></li>)}
                      </ul>
                    </div>
                  ))}
                </div>
                <Link href={`/marcas?especie=${menu.label === "Perros" ? "dog" : "cat"}`} className="mt-6 inline-flex text-sm font-semibold text-brand-blue underline-offset-4 hover:underline">Comprar por marca →</Link>
              </div>
            </div>
          ))}
          <Link href="/marcas" className="flex items-center px-3 text-sm font-semibold text-ink hover:text-brand-blue">Marcas</Link>
          <Link href="/reponer" className="flex items-center px-3 text-sm font-semibold text-ink hover:text-brand-blue">Reponer</Link>
          <Link href="/calculadora-alimento" className="flex items-center px-3 text-sm font-semibold text-ink hover:text-brand-blue">Calcular alimento</Link>
        </nav>
        )}

        <div className={minimal ? "hidden" : "ml-auto hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex"}>
          <form action="/buscar" className="relative hidden w-full max-w-64 xl:block">
            <label htmlFor="header-search" className="sr-only">Buscar productos</label>
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="header-search" name="q" type="search" defaultValue={searchQuery} placeholder="Buscar productos" className="h-11 w-full rounded-xl border border-transparent bg-catalog-canvas pl-10 pr-3 text-sm outline-none focus:border-brand-blue" />
          </form>
          <Link href="/mi-cuenta" aria-label="Mi cuenta" className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-soft-blue"><UserCircle size={23} weight="bold" aria-hidden="true" /></Link>
          <CartLink />
        </div>
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <CartLink />
          <MobileNav searchQuery={searchQuery} />
        </div>
      </div>
    </header>
  );
}
