import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_CATEGORY_URL = "https://oldprince.com.ar/categoria-producto/perros/";
const DEFAULT_OUTPUT = "data/imports/old-prince/catalog.json";
const USER_AGENT = "PatitasCatalogImporter/1.0 (+https://oldprince.com.ar/)";

const ENTITY_NAMES = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  quot: '"',
};

const sleep = (milliseconds) => new Promise((resolvePromise) => {
  setTimeout(resolvePromise, milliseconds);
});

function decodeHtml(value) {
  return value.replace(/&(#x?[\da-f]+|[a-z]+);/gi, (match, entity) => {
    const normalizedEntity = entity.toLowerCase();
    if (normalizedEntity in ENTITY_NAMES) return ENTITY_NAMES[normalizedEntity];

    if (normalizedEntity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalizedEntity.slice(2), 16));
    }
    if (normalizedEntity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalizedEntity.slice(1), 10));
    }
    return match;
  });
}

function textContent(value) {
  return decodeHtml(value
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function normalizedKey(value) {
  return textContent(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractAttribute(attributes, name) {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? decodeHtml(match[2]) : null;
}

function extractTagBlocks(html, tagName) {
  const tag = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}\\s*>`, "gi");
  return Array.from(html.matchAll(pattern), (match) => ({
    attributes: match[1],
    innerHtml: match[2],
    fullHtml: match[0],
  }));
}

function extractMetaContent(html, attribute, value) {
  const pattern = new RegExp(`<meta\\b[^>]*\\b${attribute}\\s*=\\s*(["'])${value}\\1[^>]*>`, "i");
  const match = html.match(pattern);
  return match ? extractAttribute(match[0], "content") : null;
}

function extractSections(html) {
  const headings = Array.from(
    html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi),
  );

  return headings.map((heading, index) => {
    const start = (heading.index ?? 0) + heading[0].length;
    const end = headings[index + 1]?.index ?? html.length;
    return {
      level: Number(heading[1]),
      title: textContent(heading[2]),
      html: html.slice(start, end),
    };
  });
}

function findSection(sections, title) {
  const expected = normalizedKey(title);
  return sections.find((section) => normalizedKey(section.title).includes(expected)) ?? null;
}

function extractTableRows(html) {
  return extractTagBlocks(html, "tr")
    .map((row) => Array.from(
      row.innerHtml.matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)\s*>/gi),
      (cell) => textContent(cell[1]),
    ))
    .filter((row) => row.length > 0);
}

function parseWeightRange(value) {
  const normalized = normalizedKey(value).replace(/,/g, ".");
  const range = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) {
    return {
      minKg: Number(range[1]),
      maxKg: Number(range[2]),
      source: textContent(value),
    };
  }

  const openRange = normalized.match(/(\d+(?:\.\d+)?)\s*kg?\.?\s*o mas/);
  if (openRange) {
    return {
      minKg: Number(openRange[1]),
      maxKg: null,
      source: textContent(value),
    };
  }

  const single = normalized.match(/(\d+(?:\.\d+)?)/);
  return single
    ? { minKg: Number(single[1]), maxKg: Number(single[1]), source: textContent(value) }
    : { minKg: null, maxKg: null, source: textContent(value) };
}

function extractPresentations(sectionHtml) {
  const presentationText = textContent(sectionHtml);
  const matches = Array.from(
    presentationText.matchAll(/(\d+(?:[.,]\d+)?)\s*(kg|kgs|g|gr)\b/gi),
    (match) => {
      const value = Number(match[1].replace(",", "."));
      const unit = match[2].toLowerCase();
      const weightGrams = unit.startsWith("k") ? Math.round(value * 1000) : Math.round(value);
      return {
        label: `${match[1]} ${match[2]}`,
        weightGrams,
      };
    },
  );

  return matches.filter((presentation, index) => matches.findIndex(
    (candidate) => candidate.weightGrams === presentation.weightGrams,
  ) === index);
}

function extractFeedingGuide(section) {
  if (!section) return null;
  const rows = extractTableRows(section.html);
  if (rows.length === 0) return null;

  const [headers, ...dataRows] = rows;
  return {
    title: section.title,
    headers,
    rows: dataRows.map((cells) => ({
      animalWeight: parseWeightRange(cells[0] ?? ""),
      values: cells.slice(1),
      sourceCells: cells,
    })),
  };
}

function extractComposition(section) {
  if (!section) return null;
  const rows = extractTableRows(section.html);
  if (rows.length === 0) return null;

  const [headers, ...dataRows] = rows;
  return {
    title: section.title,
    headers,
    rows: dataRows.map((cells) => ({
      ingredient: cells[0] ?? "",
      minimum: cells[1] ?? "",
      maximum: cells[2] ?? "",
      sourceCells: cells,
    })),
  };
}

function extractImages(html, sourceUrl) {
  const candidates = [];
  const galleryBlocks = html.matchAll(
    /<div\b[^>]*class\s*=\s*(["'][^"']*woocommerce-product-gallery__image[^"']*\1)[^>]*>([\s\S]*?)<\/div\s*>/gi,
  );
  for (const gallery of galleryBlocks) {
    const galleryHtml = gallery[2];
    const url = extractAttribute(galleryHtml, "data-large_image")
      ?? extractAttribute(galleryHtml, "data-src")
      ?? extractAttribute(galleryHtml, "href");
    if (url) {
      candidates.push({
        url,
        altText: textContent(
          extractAttribute(galleryHtml, "data-thumb-alt")
            ?? extractAttribute(galleryHtml, "alt")
            ?? "",
        ),
      });
    }
  }

  if (candidates.length === 0) {
    const ogImage = extractMetaContent(html, "property", "og:image");
    if (ogImage) candidates.push({ url: ogImage, altText: "" });

    for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
      const attributes = match[1];
      const url = extractAttribute(attributes, "data-lazy-src")
        ?? extractAttribute(attributes, "data-src")
        ?? extractAttribute(attributes, "src");
      if (!url) continue;
      candidates.push({
        url,
        altText: textContent(extractAttribute(attributes, "alt") ?? ""),
      });
    }
  }

  const unique = new Map();
  for (const candidate of candidates) {
    if (candidate.url.startsWith("data:")) continue;
    const absoluteUrl = new URL(candidate.url, sourceUrl).href;
    if (!/\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(absoluteUrl)) continue;
    if (!unique.has(absoluteUrl)) unique.set(absoluteUrl, { ...candidate, url: absoluteUrl });
  }
  return Array.from(unique.values());
}

function inferProductAttributes(name) {
  const key = normalizedKey(name);
  return {
    lifeStage: key.includes("cachorro") ? "puppy"
      : key.includes("senior") ? "senior"
        : key.includes("adult") ? "adult" : null,
    breedSize: key.includes("razas pequenas") ? "small"
      : key.includes("medianos y grandes") ? "medium_large"
        : key.includes("todas las razas") ? "all" : null,
    line: key.includes("proteinas noveles") ? "Proteínas Noveles"
      : key.includes("equilibrium") ? "Equilibrium"
        : key.includes("premium") ? "Premium" : null,
  };
}

export function productLinksFromCategory(html, categoryUrl) {
  const categoryOrigin = new URL(categoryUrl).origin;
  const links = new Set();
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    try {
      const url = new URL(decodeHtml(match[2]), categoryUrl);
      if (url.origin !== categoryOrigin || !/^\/producto\//i.test(url.pathname)) continue;
      url.hash = "";
      url.search = "";
      links.add(url.href.replace(/\/$/, "") + "/");
    } catch {
      // Ignore malformed links from navigation widgets.
    }
  }
  return Array.from(links);
}

export function parseProductDetail(html, sourceUrl) {
  const sections = extractSections(html);
  const titleHeading = sections.find((section) => /old prince/i.test(section.title)
    && !/menu|menú/i.test(section.title));
  const name = titleHeading?.title ?? textContent(
    extractMetaContent(html, "property", "og:title") ?? "",
  ).replace(/\s*[–-]\s*Old Prince\s*$/i, "");
  const ingredientsSection = findSection(sections, "Ingredientes");
  const presentationsSection = findSection(sections, "Presentaciones");
  const feedingSection = findSection(sections, "Cantidad diaria recomendada");
  const compositionSection = findSection(sections, "Composicion centesimal");
  const attributes = inferProductAttributes(name);

  return {
    name,
    slug: new URL(sourceUrl).pathname.split("/").filter(Boolean).pop() ?? "",
    url: sourceUrl,
    brand: "Old Prince",
    species: "dog",
    category: "DRY_FOOD",
    ...attributes,
    ingredients: ingredientsSection ? textContent(ingredientsSection.html) : null,
    presentations: presentationsSection ? extractPresentations(presentationsSection.html) : [],
    feedingGuide: extractFeedingGuide(feedingSection),
    composition: extractComposition(compositionSection),
    images: extractImages(html, sourceUrl),
  };
}

export async function fetchHtml(url, { timeoutMs = 30_000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} al consultar ${url}`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function scrapeOldPrince({
  categoryUrl = DEFAULT_CATEGORY_URL,
  delayMs = 500,
  limit = null,
  fetchPage = fetchHtml,
} = {}) {
  const categoryHtml = await fetchPage(categoryUrl);
  const productUrls = productLinksFromCategory(categoryHtml, categoryUrl).slice(0, limit ?? undefined);
  if (productUrls.length === 0) throw new Error("No se encontraron productos en la categoría indicada.");

  const products = [];
  const warnings = [];
  for (const [index, productUrl] of productUrls.entries()) {
    if (index > 0 && delayMs > 0) await sleep(delayMs);
    try {
      const detailHtml = await fetchPage(productUrl);
      const product = parseProductDetail(detailHtml, productUrl);
      if (!product.name) warnings.push(`No se pudo obtener el nombre de ${productUrl}.`);
      if (!product.ingredients) warnings.push(`No se encontraron ingredientes para ${productUrl}.`);
      products.push(product);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `No se pudo leer ${productUrl}.`);
    }
  }

  return {
    source: {
      categoryUrl,
      scrapedAt: new Date().toISOString(),
      userAgent: USER_AGENT,
    },
    products,
    warnings,
  };
}

function parseCliArguments(argumentsList) {
  const options = {
    categoryUrl: DEFAULT_CATEGORY_URL,
    output: DEFAULT_OUTPUT,
    delayMs: 500,
    limit: null,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--") continue;
    if (argument === "--category-url") options.categoryUrl = argumentsList[++index];
    else if (argument === "--output") options.output = argumentsList[++index];
    else if (argument === "--delay-ms") options.delayMs = Number(argumentsList[++index]);
    else if (argument === "--limit") options.limit = Number(argumentsList[++index]);
    else if (argument === "--help" || argument === "-h") {
      console.log("Uso: pnpm scrape:old-prince -- [--output archivo.json] [--delay-ms 500] [--limit 2]");
      process.exit(0);
    } else {
      throw new Error(`Argumento desconocido: ${argument}`);
    }
  }
  if (!Number.isInteger(options.delayMs) || options.delayMs < 0) {
    throw new Error("--delay-ms debe ser un entero mayor o igual a cero.");
  }
  if (options.limit !== null && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error("--limit debe ser un entero mayor o igual a uno.");
  }
  return options;
}

async function main() {
  const options = parseCliArguments(process.argv.slice(2));
  const result = await scrapeOldPrince(options);
  const outputPath = resolve(process.cwd(), options.output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`Scraping completado: ${result.products.length} productos guardados en ${outputPath}`);
  for (const warning of result.warnings) console.warn(`Advertencia: ${warning}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "No se pudo completar el scraping.");
    process.exitCode = 1;
  });
}
