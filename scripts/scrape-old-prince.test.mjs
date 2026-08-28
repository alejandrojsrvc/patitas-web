import assert from "node:assert/strict";
import test from "node:test";
import { parseProductDetail, productLinksFromCategory, scrapeOldPrince } from "./scrape-old-prince.mjs";

const categoryHtml = `
  <a href="/producto/old-prince-premium-adultos/">Producto</a>
  <a href="https://oldprince.com.ar/producto/old-prince-premium-adultos/?utm_source=test">Duplicado</a>
  <a href="/contacto/">Contacto</a>
`;

const detailHtml = `
  <meta property="og:image" content="/wp-content/uploads/old-prince-premium.png">
  <h2>Old Prince Premium Adultos</h2>
  <div class="woocommerce-product-gallery__image" data-thumb-alt="Old Prince Premium Adultos">
    <a href="/wp-content/uploads/old-prince-premium.png"><img data-large_image="/wp-content/uploads/old-prince-premium.png" alt="Old Prince Premium Adultos"></a>
  </div>
  <h2>Ingredientes</h2>
  <p>Harina de pollo, arroz y aceite de pescado.</p>
  <h2>Presentaciones</h2>
  <ul><li>3 Kg</li><li>20 Kg</li></ul>
  <h2>Cantidad diaria recomendada</h2>
  <table>
    <tr><th>Peso del animal</th><th>Gramos de alimento</th></tr>
    <tr><td>2 - 5 kg.</td><td>60 - 120 g.</td></tr>
    <tr><td>51 kg. o más</td><td>560 g o más</td></tr>
  </table>
  <h2>Composicion centesimal</h2>
  <table>
    <tr><th>Ingredientes</th><th>Minimo</th><th>Máximo</th></tr>
    <tr><td>Proteína</td><td>23 %</td><td></td></tr>
  </table>
  <img src="/wp-content/uploads/old-prince-premium.png" alt="Bolsa Old Prince">
`;

test("extracts and deduplicates product links from the category", () => {
  assert.deepEqual(productLinksFromCategory(categoryHtml, "https://oldprince.com.ar/categoria-producto/perros/"), [
    "https://oldprince.com.ar/producto/old-prince-premium-adultos/",
  ]);
});

test("preserves the relevant product detail data", () => {
  const product = parseProductDetail(
    detailHtml,
    "https://oldprince.com.ar/producto/old-prince-premium-adultos/",
  );

  assert.equal(product.name, "Old Prince Premium Adultos");
  assert.equal(product.line, "Premium");
  assert.deepEqual(product.presentations, [
    { label: "3 Kg", weightGrams: 3000 },
    { label: "20 Kg", weightGrams: 20000 },
  ]);
  assert.equal(product.feedingGuide.rows[0].animalWeight.minKg, 2);
  assert.equal(product.feedingGuide.rows[1].animalWeight.maxKg, null);
  assert.equal(product.composition.rows[0].minimum, "23 %");
  assert.equal(product.images[0].url, "https://oldprince.com.ar/wp-content/uploads/old-prince-premium.png");
  assert.equal(product.images[0].altText, "Old Prince Premium Adultos");
});

test("scrapes every detail sequentially with an injectable fetcher", async () => {
  const pages = new Map([
    ["https://oldprince.com.ar/categoria-producto/perros/", categoryHtml],
    ["https://oldprince.com.ar/producto/old-prince-premium-adultos/", detailHtml],
  ]);
  const result = await scrapeOldPrince({
    delayMs: 0,
    fetchPage: async (url) => pages.get(url),
  });

  assert.equal(result.products.length, 1);
  assert.deepEqual(result.warnings, []);
});
