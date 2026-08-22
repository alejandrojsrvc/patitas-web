import Image from "next/image";
import Link from "next/link";

const groups = [
  { title: "Comprar", links: [["Perros", "/perros"], ["Gatos", "/gatos"], ["Marcas", "/marcas"]] },
  { title: "Patitas", links: [["Cómo funciona", "/reponer"], ["Reponer", "/reponer"], ["Calculadora", "/calculadora-alimento"], ["Guías", "/guias"]] },
  { title: "Ayuda", links: [["Envíos", "/envios"], ["Cambios", "/cambios-y-devoluciones"], ["Preguntas frecuentes", "/preguntas-frecuentes"], ["Contacto", "/contacto"]] },
  { title: "Legal", links: [["Términos", "/terminos"], ["Privacidad", "/privacidad"], ["Defensa del consumidor", "/defensa-del-consumidor"], ["Botón de arrepentimiento", "/arrepentimiento"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-ink py-14 text-white sm:py-18">
      <div className="container-shell grid gap-12 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm">
          <Image src="/brand/patitas-logo-horizontal.png" alt="Patitas Inquietas" width={220} height={24} className="h-auto w-44 brightness-0 invert" />
          <p className="mt-5 text-sm leading-6 text-white/70">Consumibles para perros y gatos, con una ayuda extra para reponerlos antes de que se terminen.</p>
        </div>
        <div className="grid grid-cols-2 gap-9 md:grid-cols-4">
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-display text-lg font-semibold">{group.title}</h2>
              <ul className="mt-4 space-y-3 text-sm text-white/65">
                {group.links.map(([label, href]) => <li key={`${label}-${href}`}><Link href={href} className="underline-offset-4 hover:text-white hover:underline">{label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="container-shell mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/55 sm:flex-row sm:justify-between">
        <p>© 2026 Patitas Inquietas</p><p>Buenos Aires, Argentina</p>
      </div>
    </footer>
  );
}
