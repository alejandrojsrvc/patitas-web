import {
  ArrowRight,
  BellRinging,
  Calculator,
  Check,
  Clock,
  House,
  Package,
  ShieldCheck,
  ShoppingBagOpen,
  WhatsappLogo,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LandingPlanQuiz } from "@/features/landing/landing-plan-quiz";
import { getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";

const valueProps = [
  [ShoppingBagOpen, "Menos peso para vos", "Recibí alimento y esenciales en la puerta de tu casa."],
  [Calculator, "Sabés cuándo reponer", "Calculamos cuánto debería durar cada presentación."],
  [BellRinging, "Vos seguís teniendo el control", "Te ayudamos a recordar, sin cobros automáticos ni permanencia."],
  [House, "Comprás desde CABA", "La cobertura, el costo y el plazo aparecen según tu dirección."],
] as const;

const faqs = [
  ["¿Tengo que suscribirme para comprar?", "No. Podés comprar una sola vez y, si querés, guardar un recordatorio para volver a reponer cuando tenga sentido."],
  ["¿El cálculo de duración es exacto?", "Es una estimación. Usamos primero la tabla del fabricante y mostramos cuando solo contamos con una referencia general."],
  ["¿Me van a cobrar automáticamente?", "No en esta etapa. El recordatorio no guarda una tarjeta ni genera una compra sin que la confirmes."],
  ["¿Dónde entregan?", "La cobertura inicial es CABA. El costo, el plazo y la disponibilidad se muestran cuando la operación está configurada para tu dirección."],
] as const;

export default async function Home() {
  const [featuredResult, foodResult] = await Promise.all([
    safeCatalogCall(() => getProducts({ featured: true, perPage: 4 })),
    safeCatalogCall(() => getProducts({ category: "alimentos", perPage: 100 })),
  ]);
  const featuredProducts = featuredResult.ok ? featuredResult.data.items : [];
  const foodProducts = foodResult.ok ? foodResult.data.items : [];

  return (
    <>
      <a href="#contenido" className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-brand-yellow px-4 py-3 font-semibold text-ink transition-transform focus-visible:translate-y-0">Ir al contenido</a>
      <div className="bg-brand-blue px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
        <div className="container-shell flex items-center justify-center gap-2"><span aria-hidden="true">✦</span><span>Calculá cuánto dura lo que come tu mascota y reponé cuando toque.</span></div>
      </div>
      <SiteHeader minimal />
      <main id="contenido">
        <section className="overflow-hidden bg-cream py-12 sm:py-16 lg:py-24">
          <div className="container-shell grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-soft-yellow px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink"><Clock size={15} weight="bold" aria-hidden="true" />Tranquilidad para todos los días</p>
              <h1 className="display-heading max-w-3xl text-5xl sm:text-6xl lg:text-[4.75rem]">Nunca más te quedes sin comida para tu mascota.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">Calculamos cuánto debería durar su alimento y te ayudamos a reponerlo antes de que se termine. Sin cargar bolsas pesadas y sin suscripciones obligatorias.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="#plan-quiz" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 font-semibold text-white hover:bg-[#0048dc]">Calcular cuánto dura <ArrowRight size={19} weight="bold" /></Link><Link href="/perros" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-border bg-white px-6 font-semibold text-ink hover:border-brand-blue">Ver catálogo</Link></div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-ink"><span className="flex items-center gap-2"><Check size={17} weight="bold" className="text-brand-blue" />Compra única o recordatorio</span><span className="flex items-center gap-2"><Check size={17} weight="bold" className="text-brand-blue" />Datos claros antes de elegir</span></div>
            </div>
            <div className="relative mx-auto w-full max-w-xl lg:pt-4">
              <div className="absolute -left-7 top-2 size-24 rounded-full bg-brand-yellow sm:size-32" aria-hidden="true" />
              <div className="relative ml-auto overflow-hidden rounded-[2rem] bg-brand-blue p-6 text-white shadow-[0_24px_65px_rgba(0,85,255,0.22)] sm:p-9">
                <div className="absolute -right-20 -top-20 size-64 rounded-full border-[32px] border-white/10" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-5 border-b border-white/20 pb-6"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Ejemplo de reposición</p><p className="mt-3 font-display text-3xl font-semibold leading-none sm:text-4xl">La bolsa de Rocky</p></div><Package size={46} weight="duotone" className="shrink-0 text-brand-yellow" aria-hidden="true" /></div>
                <div className="relative grid grid-cols-2 gap-5 py-7"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-white/60">Peso</p><p className="mt-2 font-display text-3xl font-semibold">12 kg</p></div><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-white/60">Duración</p><p className="mt-2 font-display text-3xl font-semibold">≈ 39 días</p></div></div>
                <div className="relative rounded-2xl bg-white p-5 text-ink"><p className="text-sm text-muted">Próxima reposición estimada</p><p className="mt-2 font-display text-3xl font-semibold">29 de septiembre</p><p className="mt-3 text-xs leading-5 text-muted">Ejemplo ilustrativo. El resultado real depende del alimento y los datos de tu mascota.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="plan-quiz" className="scroll-mt-20 bg-brand-blue py-14 sm:py-20">
          <div className="container-shell grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div className="text-white lg:sticky lg:top-28"><p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-yellow">Tu primera Patitas</p><h2 className="display-heading mt-4 text-4xl sm:text-5xl">Una compra pensada para su ritmo.</h2><p className="mt-5 max-w-md text-lg leading-8 text-white/75">Respondé tres cosas sobre tu mascota y entendé qué presentación te conviene antes de agregarla al carrito.</p><div className="mt-8 border-t border-white/20 pt-5 text-sm leading-6 text-white/70"><p className="flex items-start gap-2"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand-yellow" aria-hidden="true" />La recomendación es orientativa y siempre muestra de dónde sale el cálculo.</p></div></div>
            <LandingPlanQuiz products={foodProducts} />
          </div>
        </section>

        <section className="bg-white py-14 sm:py-20"><div className="container-shell"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-blue">La diferencia está en el después</p><h2 className="display-heading mt-4 text-4xl sm:text-5xl">Comprar alimento también puede sacarte una preocupación de encima.</h2></div><div className="mt-10 grid gap-7 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">{valueProps.map(([Icon, title, text]) => <article key={title}><Icon size={31} weight="duotone" className="text-brand-blue" aria-hidden="true" /><h3 className="mt-7 font-display text-2xl font-semibold">{title}</h3><p className="mt-3 text-muted">{text}</p></article>)}</div></div></section>

        <section className="bg-soft-blue py-14 sm:py-20"><div className="container-shell grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-blue">Así se siente el recordatorio</p><h2 className="display-heading mt-4 text-4xl sm:text-5xl">Te avisamos. Vos decidís.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-muted">La idea es que el aviso llegue antes del apuro, para que puedas confirmar, esperar un poco o volver a comprar cuando realmente lo necesites.</p><p className="mt-5 text-sm font-semibold text-muted">Ejemplo ilustrativo de una futura integración por WhatsApp.</p></div><div className="mx-auto w-full max-w-md rounded-[2rem] bg-white p-4 shadow-[0_18px_50px_rgba(0,26,78,0.12)] sm:p-5"><div className="rounded-[1.5rem] bg-[#e9f7ed] p-4"><div className="flex items-center gap-3 border-b border-black/10 pb-4"><div className="flex size-10 items-center justify-center rounded-full bg-[#25d366] text-white"><WhatsappLogo size={24} weight="fill" aria-hidden="true" /></div><div><p className="font-semibold">Patitas Inquietas</p><p className="text-xs text-muted">Ejemplo de aviso</p></div></div><div className="mt-5 space-y-3 text-sm leading-6"><div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3 text-ink shadow-sm">Hola, Alejandro. A Rocky le quedan aproximadamente 5 días de alimento. ¿Querés revisar su próxima reposición?</div><div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] p-3 text-ink shadow-sm">Sí, quiero ver la bolsa de Rocky.</div><button type="button" disabled className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 font-semibold text-white opacity-90">Ver recompra <ArrowRight size={17} weight="bold" /></button></div></div></div></div></section>

        <section className="bg-cream py-14 sm:py-20"><div className="container-shell"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-blue">Para empezar hoy</p><h2 className="display-heading mt-4 text-4xl sm:text-5xl">Una selección breve, lo importante claro.</h2><p className="mt-4 max-w-xl text-muted">Alimento y esenciales para comprar lo que tu mascota ya conoce.</p></div><Link href="/perros" className="inline-flex items-center gap-2 font-semibold text-brand-blue hover:underline">Ver catálogo completo <ArrowRight size={18} weight="bold" /></Link></div><div className="mt-9"><ProductGrid products={featuredProducts} emptyCopy={featuredResult.ok ? "Todavía no hay productos destacados con precio, imagen y disponibilidad pública." : "No pudimos consultar el catálogo. Volvé a intentar en unos minutos."} /></div></div></section>

        <section className="bg-white py-14 sm:py-20"><div className="container-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-blue">Preguntas frecuentes</p><h2 className="display-heading mt-4 text-4xl sm:text-5xl">Claro antes de comprar.</h2></div><div className="divide-y divide-border border-y border-border">{faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-xl font-semibold marker:hidden"><span>{question}</span><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-soft-blue text-brand-blue transition-transform group-open:rotate-90"><ArrowRight size={17} weight="bold" aria-hidden="true" /></span></summary><p className="max-w-2xl pt-4 leading-7 text-muted">{answer}</p></details>)}</div></div></section>

        <section className="bg-brand-blue py-14 text-white sm:py-20"><div className="container-shell flex flex-col items-start justify-between gap-8 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-yellow">Cuando quieras empezar</p><h2 className="display-heading mt-4 max-w-2xl text-4xl sm:text-5xl">Vos cuidás de ellos. Nosotros te ayudamos a acordarte.</h2></div><Link href="#plan-quiz" className="inline-flex min-h-14 shrink-0 items-center gap-2 rounded-xl bg-brand-yellow px-6 font-semibold text-ink hover:bg-[#f1df00]">Armar mi plan <ArrowRight size={19} weight="bold" /></Link></div></section>
      </main>
      <SiteFooter />
    </>
  );
}
