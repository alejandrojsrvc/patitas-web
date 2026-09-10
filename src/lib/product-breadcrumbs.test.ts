import assert from "node:assert/strict";
import test from "node:test";

import type { CatalogLanding, Product } from "@/domain/catalog/types";
import { productBreadcrumbs } from "./product-breadcrumbs.ts";

const dryAdultLanding: CatalogLanding = {
  kind: "LANDING",
  landingType: "CATALOG",
  filters: { species: "DOG", category: "FOOD", foodType: "DRY", lifeStage: "ADULT" },
  seo: {
    title: "Alimento balanceado para perros adultos",
    h1: "Alimento balanceado para perros adultos",
    description: "Descripción",
    canonical: "/perros/alimentos-balanceados/adultos",
    robots: { index: true, follow: true },
  },
  breadcrumbs: [
    { label: "Inicio", href: "/" },
    { label: "Perros", href: "/perros" },
    { label: "Alimentos", href: "/perros/alimentos-balanceados" },
    { label: "Alimentos balanceados", href: "/perros/alimentos-balanceados" },
    { label: "Adultos", href: "/perros/alimentos-balanceados/adultos" },
  ],
};

function productFixture(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    slug: "adult-medium",
    name: "Adult Medium",
    description: null,
    line: null,
    species: "DOG",
    lifeStage: "ADULT",
    breedSize: null,
    brand: {
      id: "brand-1",
      name: "Royal Canin",
      slug: "royal-canin",
      description: null,
      seoTitle: null,
      seoDescription: null,
      logoUrl: null,
    },
    category: {
      id: "category-1",
      name: "Alimento seco",
      slug: "alimento-seco",
      description: null,
      seoTitle: null,
      seoDescription: null,
    },
    classification: { category: "FOOD", foodType: "DRY" },
    media: [],
    offers: [],
    variants: [],
    ...overrides,
  };
}

test("usa la jerarquía que publica el resolver de catálogo", () => {
  assert.deepEqual(productBreadcrumbs(productFixture(), [dryAdultLanding]), [
    ...dryAdultLanding.breadcrumbs,
    { label: "Royal Canin Adult Medium", href: "/producto/adult-medium" },
  ]);
});

test("conserva un breadcrumb mínimo si el manifiesto no está disponible", () => {
  assert.deepEqual(productBreadcrumbs(productFixture({ species: null, category: null }), []), [
    { label: "Inicio", href: "/" },
    { label: "Royal Canin Adult Medium", href: "/producto/adult-medium" },
  ]);
});
