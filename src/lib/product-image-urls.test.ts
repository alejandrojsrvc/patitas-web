import assert from "node:assert/strict";
import test from "node:test";

import { productImageSources } from "./product-image-urls.ts";

test("usa la variante móvil y desktop para tarjetas R2", () => {
  const sources = productImageSources("https://media.patitasinquietas.com.ar/products/product-id/PI-DC-DOG-AD-MG-15K.webp", "card");

  assert.deepEqual(sources, {
    src: "https://media.patitasinquietas.com.ar/optimized/PI-DC-DOG-AD-MG-15K/catalog-320.webp",
    desktopSrc: "https://media.patitasinquietas.com.ar/optimized/PI-DC-DOG-AD-MG-15K/catalog-640.webp",
  });
});

test("convierte una URL r2.dev a la variante del dominio público", () => {
  const sources = productImageSources("https://pub-example.r2.dev/products/product-id/PI-OP-NOV-DOG-AD-MG-15K.png", "detail");

  assert.equal(sources.src, "https://media.patitasinquietas.com.ar/optimized/PI-OP-NOV-DOG-AD-MG-15K/detail-1000.webp");
});

test("mantiene la transformación existente para Supabase Storage", () => {
  const sources = productImageSources(
    "https://project.supabase.co/storage/v1/object/public/product-media/products/product-id/image.png",
    "thumbnail",
  );

  assert.match(sources.src, /\/storage\/v1\/render\/image\/public\//);
  assert.match(sources.src, /width=240/);
  assert.match(sources.src, /height=240/);
  assert.match(sources.src, /quality=70/);
  assert.match(sources.src, /resize=contain/);
});

test("mantiene Supabase Storage local sin convertirlo a R2", () => {
  const src = "http://127.0.0.1:54321/storage/v1/object/public/product-media/products/product-id/image.png";

  assert.deepEqual(productImageSources(src, "card"), { src });
});

test("no transforma URLs externas que no son media pública", () => {
  const src = "https://example.com/products/product-id/image.png";
  assert.deepEqual(productImageSources(src, "card"), { src });
});
