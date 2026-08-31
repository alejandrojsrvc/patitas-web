import Image from "next/image";

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
  preset?: "card" | "thumbnail" | "detail";
  sizes?: string;
}) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-soft-blue ${className}`} aria-label={`Imagen de ${alt} pendiente`}>
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
  return (
    <Image
      unoptimized
      src={publicImageUrl(src, preset)}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={`object-contain ${className}`}
    />
  );
}

function publicImageUrl(src: string, preset: "card" | "thumbnail" | "detail") {
  if (src.startsWith("/")) return src;
  try {
    const url = new URL(src);
    if (!url.pathname.includes("/storage/v1/object/public/")) return src;
    url.pathname = url.pathname.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const size = preset === "detail" ? 1600 : preset === "thumbnail" ? 240 : 640;
    const quality = preset === "detail" ? 85 : preset === "thumbnail" ? 70 : 75;
    url.searchParams.set("width", String(size));
    url.searchParams.set("height", String(size));
    url.searchParams.set("quality", String(quality));
    url.searchParams.set("resize", "contain");
    return url.toString();
  } catch {
    return src;
  }
}
