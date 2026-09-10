import Image from "next/image";
import { cloudflareImageUrl } from "@/lib/cloudflare-image-url";
import Link from "next/link";

const groups = [
  {
    title: "Categorías",
    links: [
      ["Perros", "/perros"],
      ["Gatos", "/gatos"],
      ["Alimento balanceado", "/perros/alimentos-balanceados"],
      ["Arena e higiene", "/gatos/higiene"],
    ],
  },
  {
    title: "Comprar",
    links: [
      ["Marcas", "/marcas"],
      ["Productos", "/perros"],
      ["Pet shop en CABA", "/pet-shop-caba"],
      ["Calculadora", "/calculadora-alimento"],
    ],
  },
  {
    title: "Ayuda",
    links: [
      ["Preguntas frecuentes", "/preguntas-frecuentes"],
      ["Envíos", "/envios"],
      ["Cambios", "/cambios-y-devoluciones"],
      ["Contacto", "/contacto"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Términos", "/terminos"],
      ["Privacidad", "/privacidad"],
      ["Defensa del consumidor", "/defensa-del-consumidor"],
      ["Botón de arrepentimiento", "/arrepentimiento"],
    ],
  },
] as const;

function PaymentLogo({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
  return (
    <span className="flex h-8 w-16 shrink-0 items-center justify-center rounded-md bg-white px-1 shadow-sm">
      <Image
        src={cloudflareImageUrl(src, { width: 112, quality: 80 })}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        className="h-auto max-h-6 max-w-full object-contain"
      />
    </span>
  );
}

export function SiteFooter() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim();

  return (
    <footer className="bg-brand-blue py-12 text-white sm:py-16">
      <div className="container-shell grid gap-12 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm">
          <Image
            src={cloudflareImageUrl("/brand/patitas-logo-horizontal.png", { width: 448, quality: 85 })}
            alt="Patitas Inquietas"
            width={220}
            height={24}
            unoptimized
            quality={60}
            sizes="176px"
            className="h-auto w-44 brightness-0 invert"
          />
          <p className="mt-5 text-sm leading-6 text-white">Alimento balanceado, arena y esenciales para perros y gatos en CABA.</p>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex text-sm font-semibold text-brand-yellow underline-offset-4 hover:underline"
            >
              Hablar por WhatsApp →
            </a>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-9 md:grid-cols-4">
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-display text-lg font-semibold">{group.title}</h2>
              <ul className="mt-4 space-y-3 text-sm text-white">
                {group.links.map(([label, href]) => (
                  <li key={`${label}-${href}`}>
                    <Link href={href} className="underline-offset-4 hover:text-brand-yellow hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="container-shell mt-12 flex flex-col gap-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-white">© 2026 Patitas Inquietas</p>
          <p className="text-xs text-white">Buenos Aires, Argentina</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs text-white">Medios de pago:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <PaymentLogo src="/brand/payments/mercado-pago.svg" alt="Mercado Pago" width={100} height={40} />
            <PaymentLogo src="/brand/payments/visa.webp" alt="Visa" width={480} height={156} />
            <PaymentLogo src="/brand/payments/mastercard.webp" alt="Mastercard" width={480} height={85} />
            <PaymentLogo src="/brand/payments/american-express.svg" alt="American Express" width={1000} height={998} />
          </div>
        </div>
      </div>
    </footer>
  );
}
