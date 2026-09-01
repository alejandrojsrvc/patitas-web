import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const tokenHeader = "x-catalog-cache-token";

type CacheRequest = {
  scope?: unknown;
  slug?: unknown;
};

const isValidToken = (received: string | null, expected: string | undefined) => {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
};

const tagsFor = (scope: unknown, slug: unknown): string[] | null => {
  if (scope === "catalog") return ["catalog-products", "catalog-facets", "catalog-brands"];
  if (scope === "products") return ["catalog-products"];
  if (scope === "facets") return ["catalog-facets"];
  if ((scope === "product" || scope === "images") && typeof slug === "string" && slug.trim()) {
    return ["catalog-products", "catalog-facets", `catalog-product-${slug.trim()}`];
  }
  if (scope === "images") return ["catalog-products"];
  if (scope === "brand" && typeof slug === "string" && slug.trim()) {
    return ["catalog-products", "catalog-facets", "catalog-brands", `catalog-brand-${slug.trim()}`];
  }
  if (scope === "category" && typeof slug === "string" && slug.trim()) {
    return ["catalog-products", "catalog-facets"];
  }
  return null;
};

export async function POST(request: Request) {
  if (!isValidToken(request.headers.get(tokenHeader), process.env.CATALOG_CACHE_INVALIDATION_SECRET)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }

  let body: CacheRequest;
  try {
    body = (await request.json()) as CacheRequest;
  } catch {
    return NextResponse.json({ message: "El cuerpo debe ser JSON válido." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }

  const tags = tagsFor(body.scope, body.slug);
  if (!tags) {
    return NextResponse.json({ message: "Ámbito de caché inválido." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }

  for (const tag of tags) revalidateTag(tag, "max");
  return NextResponse.json({ ok: true, scope: body.scope, invalidated: tags }, { headers: { "Cache-Control": "private, no-store" } });
}
