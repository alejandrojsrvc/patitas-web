"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const slides = [
  {
    src: "/brand/landing/hero-reposicion.webp",
    alt: "Reponé el alimento de tu mascota a tiempo. Programá tu próxima compra y obtené descuentos.",
  },
  {
    src: "/brand/landing/hero-alimentos-snacks-perros.webp",
    alt: "Alimentos y snacks para perros. Encontrá tus marcas favoritas, presentaciones y premios para todos los días.",
  },
] as const;

const loopedSlides = [slides[slides.length - 1], ...slides, slides[0]];

export function HomeHeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [trackIndex, setTrackIndex] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [moving, setMoving] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );

  function move(direction: -1 | 1) {
    if (moving) return;

    const nextSlide = (activeSlide + direction + slides.length) % slides.length;
    const nextTrackIndex =
      direction === 1 ? (activeSlide === slides.length - 1 ? slides.length + 1 : trackIndex + 1) : activeSlide === 0 ? 0 : trackIndex - 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setMoving(true);
    setTransitionEnabled(true);
    setActiveSlide(nextSlide);
    setTrackIndex(nextTrackIndex);

    transitionTimer.current = setTimeout(() => {
      if (nextTrackIndex === 0 || nextTrackIndex === slides.length + 1) {
        setTransitionEnabled(false);
        setTrackIndex(nextTrackIndex === 0 ? slides.length : 1);
      }
      setMoving(false);
      transitionTimer.current = null;
    }, reducedMotion ? 0 : 520);
  }

  function showPrevious() {
    move(-1);
  }

  function showNext() {
    move(1);
  }

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Promociones destacadas"
      className="relative aspect-[1197/450] w-full overflow-hidden rounded-2xl"
    >
      <div
        className={`flex size-full ${
          transitionEnabled
            ? "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-0"
            : "transition-none"
        }`}
        style={{ transform: `translateX(-${trackIndex * 100}%)` }}
      >
        {loopedSlides.map((slide, index) => (
          <Link
            key={`${slide.src}-${index}`}
            href="/reponer"
            aria-hidden={index !== trackIndex}
            tabIndex={index === trackIndex ? 0 : -1}
            className="relative h-full w-full shrink-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              preload={index === 1}
              fetchPriority={index === 1 ? "high" : undefined}
              sizes="(min-width: 1280px) 1216px, calc(100vw - 1.25rem)"
              className="object-contain"
            />
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={showPrevious}
        disabled={moving}
        aria-label="Ver promoción anterior"
        className="absolute left-2 top-1/2 z-20 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default sm:left-3"
      >
        <CaretLeft size={17} weight="bold" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={showNext}
        disabled={moving}
        aria-label="Ver promoción siguiente"
        className="absolute right-2 top-1/2 z-20 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default sm:right-3"
      >
        <CaretRight size={17} weight="bold" aria-hidden="true" />
      </button>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Promoción {activeSlide + 1} de {slides.length}
      </p>
    </div>
  );
}
