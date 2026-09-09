"use client";

import Image from "next/image";
import { useState } from "react";

import { productImageSources, type ProductImagePreset } from "@/lib/product-image-urls";

export function ProductImage({
  src,
  alt,
  priority = false,
  className = "",
  preset = "card",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
}: {
  src?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
  preset?: ProductImagePreset;
  sizes?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const unavailable = !src || failedSrc === src;

  if (unavailable) {
    return (
      <div
        role="img"
        className={`flex h-full w-full items-center justify-center bg-soft-blue ${className}`}
        aria-label={`Imagen de ${alt} no disponible`}
      >
        <Image
          unoptimized
          src="/brand/patitas-isotipo.png"
          alt=""
          width={736}
          height={876}
          className="h-16 w-auto object-contain opacity-30"
        />
      </div>
    );
  }
  const sources = productImageSources(src, preset);
  return (
    <picture>
      {sources.desktopSrc ? <source media="(min-width: 640px)" srcSet={sources.desktopSrc} /> : null}
      <Image
        unoptimized
        src={sources.src}
        alt={alt}
        fill
        preload={priority}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
        onError={() => {
          if (src) setFailedSrc(src);
        }}
        sizes={sizes}
        className={`object-contain ${className}`}
      />
    </picture>
  );
}
