import { Plus } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { FAQJsonLd } from "@/components/seo/json-ld";

const faqs = [
  {
    question: "¿Hacen entregas en CABA?",
    answer:
      "La cobertura inicial es CABA. El costo y el plazo dependen de la dirección y se muestran cuando la zona y la tarifa están disponibles.",
  },
  {
    question: "¿Tengo que suscribirme para comprar?",
    answer:
      "No. Podés hacer una compra puntual de alimento, arena o esenciales sin contratar una suscripción.",
  },
  {
    question: "¿Cómo sé cuánto puede durarme una bolsa?",
    answer:
      "Usá la calculadora con el alimento, la presentación y el peso de tu mascota. Cuando está disponible, tomamos como referencia la tabla del fabricante.",
  },
  {
    question: "¿La calculadora reemplaza la recomendación veterinaria?",
    answer:
      "No. El resultado es orientativo: la actividad, la condición corporal y la recomendación profesional pueden cambiar la ración.",
  },
  {
    question: "¿Por qué una marca o presentación puede no aparecer?",
    answer:
      "La tienda muestra únicamente los productos publicados con precio y disponibilidad. Así evitamos enviarte a páginas vacías o presentaciones que no se pueden comprar.",
  },
];

export function FAQ() {
  return (
    <section id="preguntas-frecuentes" className="anchor-section bg-white py-14 sm:py-20" aria-labelledby="faq-title">
      <FAQJsonLd faqs={faqs} />
      <div className="container-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div>
          <h2 id="faq-title" className="display-heading text-4xl sm:text-5xl lg:text-[3.25rem]">
            Preguntas frecuentes.
          </h2>
          <p className="body-copy mt-5 max-w-md text-lg">
            Lo importante sobre compras, entregas y la calculadora, explicado sin vueltas.
          </p>
          <Link href="/preguntas-frecuentes" className="mt-7 inline-flex font-semibold text-brand-blue underline-offset-4 hover:underline">Ver todas las respuestas →</Link>
        </div>

        <div className="border-t border-border">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-border">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-xl font-semibold leading-tight marker:hidden hover:text-brand-blue sm:text-2xl [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <Plus
                  size={22}
                  weight="bold"
                  className="shrink-0 text-brand-blue transition-transform duration-200 group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="max-w-2xl pb-6 pr-10 leading-7 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
