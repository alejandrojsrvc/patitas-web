import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AddOns } from "@/components/sections/add-ons";
import { DeliveryRhythm } from "@/components/sections/delivery-rhythm";
import { FAQ } from "@/components/sections/faq";
import { FamiliarFood } from "@/components/sections/familiar-food";
import { FinalCTA } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { PetSupplyExample } from "@/components/sections/pet-supply-example";
import { PetsCovered } from "@/components/sections/pets-covered";
import { RecurringBenefit } from "@/components/sections/recurring-benefit";

export default function Home() {
  return (
    <>
      <a
        href="#contenido"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-brand-yellow px-4 py-3 font-semibold text-ink transition-transform focus-visible:translate-y-0"
      >
        Ir al contenido
      </a>
      <SiteHeader />
      <main id="contenido">
        <Hero />
        <HowItWorks />
        <PetSupplyExample />
        <RecurringBenefit />
        <FamiliarFood />
        <DeliveryRhythm />
        <AddOns />
        <PetsCovered />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}
