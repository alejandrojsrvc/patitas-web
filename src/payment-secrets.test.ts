import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const forbidden = [
  ["MERCADO", "_PAGO_ACCESS_TOKEN"].join(""),
  ["MERCADOPAGO", "_ACCESS_TOKEN"].join(""),
  ["PAYWAY", "_PRIVATE_KEY"].join(""),
  ["PAYWAY", "_PRIVATE_API_KEY"].join(""),
  ["MERCADOPAGO", "_WEBHOOK_SECRET"].join(""),
];

test("el frontend no contiene secretos de proveedores", () => {
  const root = join(process.cwd(), "src");
  const files: string[] = [];
  walk(root, files);
  for (const file of files) {
    if (file.endsWith("payment-secrets.test.ts")) continue;
    const source = readFileSync(file, "utf8");
    for (const secretName of forbidden) assert.equal(source.includes(secretName), false, `${file} contiene ${secretName}`);
  }
});

function walk(directory: string, files: string[]) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(ts|tsx|js|jsx)$/.test(path)) files.push(path);
  }
}
