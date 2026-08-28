import Image from "next/image";
import Link from "next/link";

const groups = [
  { title: "Categorías", links: [["Perros", "/perros"], ["Gatos", "/gatos"], ["Arena e higiene", "/gatos/arena"], ["Snacks", "/perros/snacks"]] },
  { title: "Comprar", links: [["Marcas", "/marcas"], ["Productos", "/buscar"], ["Pet shop en CABA", "/pet-shop-caba"], ["Calculadora", "/calculadora-alimento"]] },
  { title: "Ayuda", links: [["Preguntas frecuentes", "/preguntas-frecuentes"], ["Envíos", "/envios"], ["Cambios", "/cambios-y-devoluciones"], ["Contacto", "/contacto"]] },
  { title: "Legal", links: [["Términos", "/terminos"], ["Privacidad", "/privacidad"], ["Defensa del consumidor", "/defensa-del-consumidor"], ["Botón de arrepentimiento", "/arrepentimiento"]] },
] as const;

function MercadoPagoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" className={className} aria-label="Mercado Pago">
      <rect width="120" height="40" rx="4" fill="#009ee3" />
      <path d="M30 10l-8 20h6l2-5h7l-2 5h6L34 10h-4zm4 12l2-6 2 6h-4z" fill="white" />
      <path d="M50 10l-4 10-4-10h-6l8 20h5l2-5 4 5h6l-8-20h-3z" fill="#009ee3" />
      <text x="65" y="26" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14">mercadopago</text>
    </svg>
  );
}

function VisaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 50" className={className} aria-label="Visa">
      <rect width="80" height="50" rx="6" fill="white" stroke="#e8e8e3" strokeWidth="1" />
      <text x="40" y="30" fill="#1a1f71" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="20" textAnchor="middle">VISA</text>
    </svg>
  );
}

function MastercardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 50" className={className} aria-label="Mastercard">
      <rect width="80" height="50" rx="6" fill="white" stroke="#e8e8e3" strokeWidth="1" />
      <circle cx="32" cy="25" r="12" fill="#eb001b" />
      <circle cx="48" cy="25" r="12" fill="#f79e1b" />
      <path d="M40 15.2a12 12 0 0 1 0 19.6 12 12 0 0 1 0-19.6z" fill="#ff5f00" />
    </svg>
  );
}

export function SiteFooter() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim();

  return (
    <footer className="border-t border-border bg-ink py-14 text-white sm:py-18">
      <div className="container-shell grid gap-12 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm">
          <Image src="/brand/patitas-logo-horizontal.png" alt="Patitas Inquietas" width={220} height={24} className="h-auto w-44 brightness-0 invert" />
          <p className="mt-5 text-sm leading-6 text-white/70">Alimento balanceado, arena y esenciales para perros y gatos en CABA.</p>
          {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-semibold text-white underline-offset-4 hover:underline">Hablar por WhatsApp →</a> : null}
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
      <div className="container-shell mt-12 flex flex-col gap-4 border-t border-white/15 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/55">© 2026 Patitas Inquietas</p>
          <p className="text-xs text-white/55">Buenos Aires, Argentina</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">Medios de pago:</span>
          <div className="flex items-center gap-2">
            <MercadoPagoIcon className="h-8 w-auto" />
            <VisaIcon className="h-8 w-auto" />
            <MastercardIcon className="h-8 w-auto" />
          </div>
        </div>
      </div>
    </footer>
  );
}
