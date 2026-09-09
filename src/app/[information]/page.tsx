import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const pages = {
  "preguntas-frecuentes": {
    title: "Preguntas frecuentes",
    intro: "Respuestas claras sobre compra, cálculo y entregas.",
    sections: [
      ["¿Puedo comprar una sola vez?", "Sí. Podés hacer una compra puntual y no necesitás contratar una suscripción."],
      [
        "¿La duración que muestra la calculadora es exacta?",
        "No. Es una estimación basada primero en la tabla del fabricante. La fuente siempre se muestra.",
      ],
      [
        "¿Dónde entregan?",
        "La cobertura inicial es CABA. El costo y el plazo dependen de la dirección y se muestran cuando la zona y la tarifa están disponibles.",
      ],
      [
        "¿Por qué una marca o presentación puede no aparecer?",
        "La tienda muestra únicamente los productos publicados con precio y disponibilidad.",
      ],
    ],
  },
  envios: {
    title: "Envíos",
    intro: "Cobertura inicial en CABA.",
    sections: [
      ["Cobertura", "El checkout validará el código postal y el barrio antes de iniciar el pago."],
      ["Costo y plazo", "Todavía no publicamos una promesa logística: se mostrará cuando la zona, tarifa y operador estén confirmados."],
    ],
  },
  "cambios-y-devoluciones": {
    title: "Cambios y devoluciones",
    intro: "Esta política debe quedar confirmada antes del lanzamiento transaccional.",
    sections: [
      [
        "Contenido pendiente",
        "No vamos a inventar plazos ni condiciones. La versión definitiva se publicará después de la revisión operativa y legal.",
      ],
    ],
  },
  contacto: {
    title: "Contacto",
    intro: "Estamos preparando los canales de atención de Patitas.",
    sections: [
      ["Ayuda con una compra", "El canal de soporte y su horario se publicarán antes de habilitar pagos."],
      ["Consultas de producto", "Podés consultarnos por marca, etapa o presentación cuando el canal de atención esté publicado."],
    ],
  },
  terminos: {
    title: "Términos y condiciones",
    intro: "Documento pendiente de revisión legal antes del lanzamiento.",
    sections: [["Estado", "Esta página reserva la URL definitiva, pero todavía no constituye los términos comerciales de Patitas."]],
  },
  privacidad: {
    title: "Privacidad",
    intro: "Documento pendiente de revisión legal antes del lanzamiento.",
    sections: [
      [
        "Principio",
        "Los datos de mascotas y consumo se usarán para personalizar cálculos, separados de la información original del producto.",
      ],
      ["Estado", "La política completa debe detallar responsables, conservación, derechos y proveedores antes de captar datos personales."],
    ],
  },
  "defensa-del-consumidor": {
    title: "Defensa del consumidor",
    intro: "Acceso a la información oficial para consumidores en Argentina.",
    sections: [
      ["Contenido pendiente", "La URL oficial y el texto obligatorio se incorporarán durante la revisión legal previa al lanzamiento."],
    ],
  },
  arrepentimiento: {
    title: "Botón de arrepentimiento",
    intro: "La solicitud online estará disponible antes de habilitar ventas.",
    sections: [
      [
        "Contenido pendiente",
        "El formulario y el circuito operativo deben existir antes de aceptar pagos; esta pantalla no simula una solicitud que todavía no puede procesarse.",
      ],
    ],
  },
} as const;
type InformationSlug = keyof typeof pages;
type Props = { params: Promise<{ information: string }> };
export function generateStaticParams() {
  return Object.keys(pages).map((information) => ({ information }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).information as InformationSlug;
  const page = pages[slug];
  return page
    ? {
        title: `${page.title} | Patitas Inquietas`,
        description: page.intro,
        alternates: { canonical: `/${slug}` },
        robots: ["terminos", "privacidad", "defensa-del-consumidor", "arrepentimiento"].includes(slug)
          ? { index: false, follow: true }
          : undefined,
      }
    : {};
}
export default async function InformationPage({ params }: Props) {
  const slug = (await params).information as InformationSlug;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="min-h-[65vh] bg-page-bg py-14 sm:py-20">
        <article className="container-shell">
          <h1 className="display-heading max-w-4xl text-5xl sm:text-7xl">{page.title}</h1>
          <p className="mt-6 max-w-2xl text-xl text-muted">{page.intro}</p>
          <div className="mt-12 max-w-3xl border-t border-border">
            {page.sections.map(([title, content]) => (
              <section key={title} className="border-b border-border py-7">
                <h2 className="font-display text-2xl font-semibold">{title}</h2>
                <p className="mt-3 leading-7 text-muted">{content}</p>
              </section>
            ))}
          </div>
          <Link href="/" className="mt-10 inline-flex font-semibold text-brand-blue hover:underline">
            Volver al inicio →
          </Link>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
