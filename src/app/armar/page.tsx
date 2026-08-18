import { ArrowLeft } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BuildPlanWizard } from "@/features/build-plan/components/build-plan-wizard";
import { consumableOptions } from "@/features/build-plan/mocks/consumables";
import { foodCatalog } from "@/features/build-plan/mocks/food-catalog";

export const metadata: Metadata = {
  title: "Armar mi Patitas | Patitas Inquietas",
  description:
    "Configurá a tu mascota y obtené una propuesta inicial de abastecimiento según lo que consume.",
};

export default function BuildPlanPage() {
  return (
    <>
      <a
        href="#wizard"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-brand-yellow px-4 py-3 font-semibold text-ink transition-transform focus-visible:translate-y-0"
      >
        Ir al formulario
      </a>
      <header className="border-b border-border bg-cream">
        <div className="container-shell flex h-18 items-center justify-between gap-5">
          <Link href="/" aria-label="Patitas Inquietas, volver al inicio" translate="no">
            <Image
              src="/brand/patitas-logo-horizontal.png"
              alt="Patitas Inquietas"
              width={220}
              height={24}
              loading="eager"
              className="h-auto w-[170px] sm:w-[190px]"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-ink transition-colors hover:text-brand-blue sm:px-3"
          >
            <ArrowLeft size={17} weight="bold" aria-hidden="true" />
            <span className="hidden sm:inline">Volver al inicio</span>
            <span className="sm:hidden">Volver</span>
          </Link>
        </div>
      </header>
      <main id="wizard">
        <BuildPlanWizard catalog={foodCatalog} consumables={consumableOptions} />
      </main>
    </>
  );
}
