#!/usr/bin/env node

const origin = process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL;
if (!origin) {
  console.error("Uso: node scripts/seo-audit.mjs https://patitasinquietas.com.ar");
  process.exit(1);
}

const baseUrl = new URL(origin);
const sitemapUrl = new URL("/sitemap.xml", baseUrl);
const sitemapResponse = await fetch(sitemapUrl);
if (!sitemapResponse.ok) throw new Error(`No se pudo leer ${sitemapUrl}: HTTP ${sitemapResponse.status}`);

const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => normalizeUrl(match[1].trim()));
if (!urls.length) throw new Error("El sitemap no contiene URLs.");

const pages = [];
const inbound = new Map(urls.map((url) => [url, 0]));

for (const url of urls) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    const html = await response.text();
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
    const text = stripMarkup(main);
    const links = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => resolveInternalUrl(match[1], baseUrl)).filter(Boolean);
    for (const link of links) if (inbound.has(link)) inbound.set(link, inbound.get(link) + 1);

    pages.push({
      url,
      status: response.status,
      indexable: !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html),
      title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "",
      description: html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "",
      h1Count: (main.match(/<h1\b/gi) ?? []).length,
      words: text ? text.split(/\s+/).filter(Boolean).length : 0,
      internalLinks: links.length,
      type: classify(new URL(url).pathname),
    });
  } catch (error) {
    pages.push({ url, status: 0, error: error instanceof Error ? error.message : String(error) });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  origin: baseUrl.origin,
  totals: {
    sitemapUrls: urls.length,
    crawled: pages.length,
    indexable: pages.filter((page) => page.indexable).length,
    totalMainContentWords: pages.reduce((sum, page) => sum + (page.words ?? 0), 0),
    totalInternalLinks: pages.reduce((sum, page) => sum + (page.internalLinks ?? 0), 0),
    orphanCandidates: [...inbound.values()].filter((count) => count === 0).length,
  },
  byType: pages.reduce((groups, page) => {
    const type = page.type ?? "other";
    (groups[type] ??= []).push(page);
    return groups;
  }, {}),
  orphanCandidates: [...inbound.entries()].filter(([, count]) => count === 0).map(([url]) => url),
  pages,
};

console.log(JSON.stringify(report, null, 2));

function stripMarkup(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveInternalUrl(href, base) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return null;
  try {
    const url = new URL(href, base);
    if (url.origin !== base.origin) return null;
    url.hash = "";
    return normalizeUrl(url.toString());
  } catch {
    return null;
  }
}

function normalizeUrl(value) {
  const url = new URL(value);
  url.hash = "";
  return url.toString().replace(/\/$/, "") || url.origin;
}

function classify(pathname) {
  if (pathname === "/") return "home";
  if (pathname === "/pet-shop-caba") return "local-landing";
  if (pathname.startsWith("/producto/")) return "product";
  if (pathname.startsWith("/marcas/")) return "brand";
  if (pathname.startsWith("/guias/")) return "guide";
  if (pathname.startsWith("/perros") || pathname.startsWith("/gatos")) return "category";
  if (pathname === "/calculadora-alimento" || pathname === "/reponer") return "replenishment";
  return "information";
}
