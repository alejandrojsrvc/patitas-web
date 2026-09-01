export type ProductImagePreset = "card" | "thumbnail" | "detail";

export type ProductImageSources = {
  src: string;
  desktopSrc?: string;
};

const PUBLIC_MEDIA_BASE_URL = "https://media.patitasinquietas.com.ar";

export function productImageSources(src: string, preset: ProductImagePreset): ProductImageSources {
  if (src.startsWith("/")) return { src };

  try {
    const url = new URL(src);
    const physicalSources = physicalVariantSources(url, preset);
    if (physicalSources) return physicalSources;

    return { src: publicImageUrl(src, preset) };
  } catch {
    return { src };
  }
}

function physicalVariantSources(url: URL, preset: ProductImagePreset): ProductImageSources | null {
  if (!isPublicProductMediaUrl(url)) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 3 || segments[0] !== "products") return null;

  const fileName = decodeURIComponent(segments[2]);
  const extensionIndex = fileName.lastIndexOf(".");
  if (extensionIndex <= 0) return null;

  const sku = fileName.slice(0, extensionIndex);
  const baseUrl = `${PUBLIC_MEDIA_BASE_URL}/optimized/${encodeURIComponent(sku)}`;

  if (preset === "detail") return { src: `${baseUrl}/detail-1000.webp` };
  if (preset === "card") {
    return {
      src: `${baseUrl}/catalog-320.webp`,
      desktopSrc: `${baseUrl}/catalog-640.webp`,
    };
  }

  return { src: `${baseUrl}/catalog-320.webp` };
}

function publicImageUrl(src: string, preset: ProductImagePreset) {
  try {
    const url = new URL(src);
    if (isLocalStorageUrl(url)) {
      url.pathname = url.pathname.replace("/storage/v1/render/image/public/", "/storage/v1/object/public/");
      ["width", "height", "quality", "resize"].forEach((key) => url.searchParams.delete(key));
      return url.toString();
    }
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

function isPublicProductMediaUrl(url: URL) {
  return url.hostname === "media.patitasinquietas.com.ar" || url.hostname.endsWith(".r2.dev");
}

function isLocalStorageUrl(url: URL) {
  return (url.hostname === "127.0.0.1" || url.hostname === "localhost") && url.port === "54321";
}
