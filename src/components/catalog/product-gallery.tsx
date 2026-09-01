"use client";

import { CaretLeft, CaretRight, MagnifyingGlassPlus, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

import type { ProductMedia } from "@/domain/catalog/types";
import { ProductImage } from "./product-image";

export function ProductGallery({
  media,
  productName,
  selectedVariantId,
}: {
  media: ProductMedia[];
  productName: string;
  selectedVariantId?: string;
}) {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const visibleMedia = useMemo(() => {
    if (!selectedVariantId) return media;
    const variantMedia = media.filter((item) => item.variantId === selectedVariantId);
    if (!variantMedia.length) return media;
    return [...variantMedia, ...media.filter((item) => item.variantId === null)];
  }, [media, selectedVariantId]);
  const current = visibleMedia[selected];

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [lightboxOpen]);

  function showMedia(index: number) {
    setSelected(index);
    setZoomed(false);
  }

  function showPrevious() {
    showMedia((selected - 1 + visibleMedia.length) % visibleMedia.length);
  }

  function showNext() {
    showMedia((selected + 1) % visibleMedia.length);
  }

  const thumbnails = visibleMedia.map((item, index) => (
    <button
      key={`${item.url}-${index}`}
      type="button"
      onClick={() => showMedia(index)}
      aria-label={`Ver imagen ${index + 1} de ${productName}`}
      aria-pressed={selected === index}
      className={`relative size-16 shrink-0 overflow-hidden rounded-xl border bg-white transition-colors sm:size-[4.5rem] ${selected === index ? "border-brand-blue ring-1 ring-brand-blue" : "border-border hover:border-brand-blue"}`}
    >
      <ProductImage src={item.url} alt="" preset="thumbnail" className="p-2" />
    </button>
  ));

  return (
    <div className="min-w-0">
      <div className={visibleMedia.length > 1 ? "sm:grid sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-3" : undefined}>
        {visibleMedia.length > 1 ? (
          <div className="no-scrollbar hidden max-h-[34rem] flex-col gap-3 overflow-y-auto sm:flex" aria-label="Imágenes del producto">
            {thumbnails}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => current?.url && setLightboxOpen(true)}
          disabled={!current?.url}
          aria-label={current?.url ? `Ampliar imagen de ${productName}` : undefined}
          className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-white text-left disabled:cursor-default"
        >
          <ProductImage
            src={current?.url}
            alt={current?.altText ?? productName}
            preset="detail"
            priority
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="p-6 sm:p-10"
          />
          {current?.url ? (
            <span className="absolute bottom-3 right-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/95 px-3 text-xs font-semibold text-ink shadow-[0_6px_18px_rgba(23,23,23,0.12)] transition-colors group-hover:text-brand-blue">
              <MagnifyingGlassPlus size={17} aria-hidden="true" /> Ampliar
            </span>
          ) : null}
        </button>
      </div>
      {visibleMedia.length > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 sm:hidden" aria-label="Imágenes del producto">
          {thumbnails}
        </div>
      ) : null}
      {lightboxOpen && current?.url ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galería ampliada de ${productName}`}
          className="fixed inset-0 z-[80] bg-ink/90 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false);
          }}
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="mb-3 flex items-center justify-between gap-4 text-white">
              <p className="text-sm font-semibold tabular-nums">
                Imagen {selected + 1} de {visibleMedia.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomed((value) => !value)}
                  aria-pressed={zoomed}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-ink hover:text-brand-blue"
                >
                  <MagnifyingGlassPlus size={18} />
                  {zoomed ? "Tamaño normal" : "Zoom 2×"}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setLightboxOpen(false)}
                  aria-label="Cerrar galería ampliada"
                  className="flex size-11 items-center justify-center rounded-xl bg-white text-ink hover:text-brand-blue"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-white">
              <ProductImage
                src={current.url}
                alt={current.altText ?? productName}
                preset="detail"
                sizes="100vw"
                className={`p-6 transition-transform duration-300 sm:p-10 ${zoomed ? "scale-200" : "scale-100"}`}
              />
              {visibleMedia.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    aria-label="Ver imagen anterior"
                    className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white text-ink shadow-[0_6px_18px_rgba(23,23,23,0.16)] hover:text-brand-blue"
                  >
                    <CaretLeft size={22} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Ver imagen siguiente"
                    className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white text-ink shadow-[0_6px_18px_rgba(23,23,23,0.16)] hover:text-brand-blue"
                  >
                    <CaretRight size={22} weight="bold" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
