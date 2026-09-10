export type CloudflareImageOptions = {
  width: number;
  height?: number;
  fit?: "contain" | "cover";
  quality?: number;
};

const PUBLIC_MEDIA_HOST = "media.patitasinquietas.com.ar";

export function cloudflareImageUrl(src: string, options: CloudflareImageOptions): string {
  if (process.env.NODE_ENV !== "production") return src;

  const siteZone = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteZone || !src) throw new Error("NEXT_PUBLIC_SITE_URL es obligatoria para Cloudflare Image Transformations");

  const source = src.startsWith("/") ? src : new URL(src);
  if (source instanceof URL && source.hostname !== PUBLIC_MEDIA_HOST) return src;
  if (source instanceof URL && source.pathname.startsWith("/optimized/")) return src;

  const zone = source instanceof URL && source.hostname === PUBLIC_MEDIA_HOST ? source.origin : siteZone;
  const sourcePath = source instanceof URL ? source.pathname : src;
  if (/\.svg$/i.test(sourcePath)) return src;
  const normalizedPath = sourcePath.startsWith("/") ? sourcePath.slice(1) : sourcePath;
  const params = [`width=${options.width}`, `quality=${options.quality ?? 75}`, "format=auto"];
  if (options.height) params.push(`height=${options.height}`);
  if (options.fit) params.push(`fit=${options.fit}`);

  return `${zone}/cdn-cgi/image/${params.join(",")}/${encodeURI(normalizedPath)}`;
}
