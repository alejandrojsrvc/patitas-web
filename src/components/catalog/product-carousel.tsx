"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useId, useRef } from "react";
import type { Product } from "@/domain/catalog/types";
import { ProductCard } from "./product-card";

export function ProductCarousel({ products }: { products: Product[] }) {
  const track = useRef<HTMLUListElement>(null);
  const id = useId();
  if (!products.length) return null;
  function scroll(direction: number) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }
  return (
    <section className="mt-8 min-w-0 text-left" aria-labelledby={`${id}-title`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="font-display text-2xl font-semibold">
            Encontrá algo para tu mascota
          </h2>
          <Link href="/perros" className="mt-1 inline-flex min-h-10 items-center text-sm font-semibold text-brand-blue hover:underline">
            Ver todos los productos
          </Link>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-controls={id}
            aria-label="Ver productos anteriores"
            className="flex size-11 items-center justify-center rounded-lg bg-white text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-controls={id}
            aria-label="Ver más productos"
            className="flex size-11 items-center justify-center rounded-lg bg-white text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      <ul
        id={id}
        ref={track}
        tabIndex={0}
        aria-label="Productos para agregar al carrito"
        className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 focus-visible:outline-2 focus-visible:outline-brand-blue"
      >
        {products.map((product) => (
          <li key={product.id} className="w-[min(75vw,250px)] shrink-0 snap-start">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
