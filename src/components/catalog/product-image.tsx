"use client";

import Image from "next/image";
import { useState } from "react";

import { productImageSources, type ProductImagePreset } from "@/lib/product-image-urls";
import { cloudflareImageUrl } from "@/lib/cloudflare-image-url";

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
          src={cloudflareImageUrl("/brand/patitas-isotipo.png", { width: 320, quality: 75 })}
          alt=""
          width={736}
          height={876}
          className="h-16 w-auto object-contain opacity-30"
        />
      </div>
    );
  }
  const sources = productImageSources(src, preset);
  const imageOptions =
    preset === "detail"
      ? { width: 1000, height: 1000, fit: "contain" as const, quality: 85 }
      : preset === "thumbnail"
        ? { width: 240, height: 240, fit: "contain" as const, quality: 70 }
        : { width: 320, height: 320, fit: "contain" as const, quality: 75 };
  const transformedSrc = cloudflareImageUrl(sources.src, imageOptions);
  const transformedDesktopSrc = sources.desktopSrc
    ? cloudflareImageUrl(sources.desktopSrc, { ...imageOptions, width: 640 })
    : undefined;
  return (
    <picture>
      {transformedDesktopSrc ? (
        <source media="(min-width: 640px)" srcSet={`${transformedSrc} 320w, ${transformedDesktopSrc} 640w`} sizes={sizes} />
      ) : null}
      <Image
        unoptimized
        src={transformedSrc}
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
