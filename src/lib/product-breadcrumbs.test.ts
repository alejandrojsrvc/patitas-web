import assert from "node:assert/strict";
import test from "node:test";

import type { Product } from "@/domain/catalog/types";
import { productBreadcrumbs } from "./product-breadcrumbs.ts";

function productFixture(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    slug: "adult-medium",
    name: "Adult Medium",
    description: null,
    species: "dog",
    lifeStage: "adult",
    brand: { id: "brand-1", name: "Royal Canin", slug: "royal-canin" },
    category: { id: "category-1", name: "Alimento seco", slug: "alimento-seco" },
    media: [],
    offers: [],
    variants: [],
    ...overrides,
  } as Product;
}

test("builds the visible hierarchy without duplicating the brand", () => {
  assert.deepEqual(productBreadcrumbs(productFixture()), [
    { label: "Inicio", href: "/" },
    { label: "Perros", href: "/perros" },
    { label: "Alimento seco", href: "/perros/alimentos/secos" },
    { label: "Royal Canin Adult Medium", href: "/producto/adult-medium" },
  ]);
});

test("omits unavailable levels while keeping the canonical product item", () => {
  assert.deepEqual(productBreadcrumbs(productFixture({ species: null, category: null })), [
    { label: "Inicio", href: "/" },
    { label: "Royal Canin Adult Medium", href: "/producto/adult-medium" },
  ]);
});

test("falls back to catalog search when the category has no species", () => {
  assert.deepEqual(productBreadcrumbs(productFixture({ species: null })), [
    { label: "Inicio", href: "/" },
    { label: "Alimento seco", href: "/buscar?category=alimento-seco" },
    { label: "Royal Canin Adult Medium", href: "/producto/adult-medium" },
  ]);
});
