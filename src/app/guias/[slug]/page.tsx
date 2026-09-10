import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { guides, type GuideSlug } from "@/data/guides";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return Object.keys(guides).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug as GuideSlug;
  const guide = guides[slug];
  return guide ? { title: `${guide.title} | Patitas`, description: guide.description, alternates: { canonical: `/guias/${slug}` } } : {};
}
export default async function GuidePage({ params }: Props) {
  const slug = (await params).slug as GuideSlug;
  const guide = guides[slug];
  if (!guide) notFound();
  const isDogGuide = slug.includes("perro");
  const catalogHref = isDogGuide ? "/perros/alimentos-balanceados" : "/gatos/alimentos-balanceados";
  const catalogLabel = isDogGuide ? "Ver alimento para perros" : "Ver alimento para gatos";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: "es-AR",
    publisher: { "@type": "Organization", name: "Patitas Inquietas" },
  };
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="bg-page-bg py-14 sm:py-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <article className="container-shell">
          <Link href="/guias" className="text-sm font-semibold text-brand-blue hover:underline">
            ← Todas las guías
          </Link>
          <h1 className="display-heading mt-6 max-w-4xl text-5xl sm:text-7xl">{guide.title}</h1>
          <p className="mt-6 max-w-3xl text-xl leading-8 text-muted">{guide.description}</p>
          <div className="mt-12 max-w-3xl space-y-7 text-lg leading-8 text-ink">
            {guide.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-12 max-w-3xl rounded-2xl bg-brand-blue p-7 text-white">
            <h2 className="font-display text-3xl font-semibold">Pasá de la explicación a tu caso.</h2>
            <p className="mt-3 text-white/75">
              Elegí un producto y una presentación. La calculadora te va a decir si usa una tabla de fabricante o una estimación general.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/calculadora-alimento"
                className="inline-flex min-h-13 items-center justify-center rounded-xl bg-brand-yellow px-5 font-semibold text-ink"
              >
                {guide.cta}
              </Link>
              <Link
                href={catalogHref}
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/35 px-5 font-semibold text-white hover:bg-white/10"
              >
                {catalogLabel}
              </Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
