import Image from "next/image";

const footerGroups = [
  {
    title: "Patitas",
    links: [
      { href: "#como-funciona", label: "Cómo funciona" },
      { href: "#que-recibes", label: "Qué recibís" },
      { href: "#armar", label: "Armar mi Patitas" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { href: "#preguntas", label: "Preguntas frecuentes" },
      { href: "#cobertura", label: "Zona de cobertura" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-cream py-12 sm:py-16">
      <div className="container-shell grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm" translate="no">
          <Image
            src="/brand/patitas-logo-principal.png"
            alt="Patitas Inquietas"
            width={190}
            height={72}
            className="h-auto w-40"
          />
          <p className="mt-5 text-sm leading-6 text-muted">
            Abastecimiento recurrente para que a tu mascota no le falte lo que
            consume todos los días.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="font-display text-lg font-semibold">{group.title}</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {group.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="underline-offset-4 transition-colors hover:text-brand-blue hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container-shell mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Patitas Inquietas</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <span title="Contenido legal pendiente">Términos · Próximamente</span>
          <span title="Contenido legal pendiente">Privacidad · Próximamente</span>
          <span title="Redes pendientes">Redes · Próximamente</span>
        </div>
      </div>
    </footer>
  );
}
