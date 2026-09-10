import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "@phosphor-icons/react/ssr";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getBrands, resolveCatalogPath, safeCatalogCall } from "@/infrastructure/api/patitas-api";
import { brandLogoUrl } from "@/lib/brand-assets";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { catalogLandingMetadata } from "@/features/catalog/catalog-landing-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return catalogLandingMetadata("/marcas", {});
}

export default async function BrandsPage() {
  const [result, taxonomy] = await Promise.all([
    safeCatalogCall(() => getBrands()),
    safeCatalogCall(() => resolveCatalogPath("/marcas")),
  ]);
  return (
    <>
      {taxonomy.ok && taxonomy.data.kind === "LANDING" ? <BreadcrumbJsonLd breadcrumbs={taxonomy.data.breadcrumbs} /> : null}
      <SiteHeader publicOnly />
      <main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-12 sm:py-16 lg:py-20">
        <div className="container-shell">
          <h1 className="display-heading text-5xl sm:text-7xl">Marcas</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">Volvé directo a la marca que tu perro o gato ya conoce.</p>
          {result.ok && result.data.length ? (
            <div className="mt-10 grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4 lg:gap-3">
              {result.data.map((brand) => {
                const logoUrl = brandLogoUrl(brand);
                return (
                  <Link
                    key={brand.id}
                    href={`/marcas/${brand.slug}`}
                    className="group flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl p-4 text-center transition-opacity hover:opacity-75 focus-visible:outline-offset-2"
                  >
                    {logoUrl ? (
                      <span className="relative h-16 w-full max-w-28">
                        <Image src={logoUrl} alt={brand.name} fill unoptimized={false} sizes="112px" className="object-contain" />
                      </span>
                    ) : (
                      <span className="flex h-14 items-center justify-center text-brand-blue" aria-hidden="true">
                        <PawPrint size={38} weight="duotone" />
                      </span>
                    )}
                    <span className="text-xs font-semibold text-brand-blue">Ver productos →</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl bg-soft-blue p-7">
              <h2 className="font-display text-2xl font-semibold">Todavía no hay marcas publicables</h2>
              <p className="mt-2 text-muted">
                {result.ok ? "Una marca aparece cuando tiene al menos un producto activo con precio." : result.error}
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
