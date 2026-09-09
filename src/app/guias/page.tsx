import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { guides } from "@/data/guides";
export const metadata: Metadata = {
  title: "Guías de alimentación y reposición | Patitas",
  description: "Respuestas prácticas para elegir cuánto alimento comprar y cuándo reponerlo.",
  alternates: { canonical: "/guias" },
};
export default function GuidesPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="bg-page-bg py-14 sm:py-20">
        <div className="container-shell">
          <h1 className="display-heading max-w-4xl text-5xl sm:text-7xl">Entender cuánto compra tu mascota también es cuidarla.</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            Guías prácticas conectadas con la calculadora y el catálogo. Sin una respuesta universal escondida detrás de un título.
          </p>
          <div className="mt-12 border-t border-border">
            {Object.entries(guides).map(([slug, guide]) => (
              <Link key={slug} href={`/guias/${slug}`} className="group grid gap-2 border-b border-border py-7 sm:grid-cols-[1fr_2fr]">
                <h2 className="font-display text-2xl font-semibold group-hover:text-brand-blue">{guide.title} →</h2>
                <p className="text-muted">{guide.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
