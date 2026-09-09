import assert from "node:assert/strict";
import test from "node:test";
import {
  hasRequiredDeliveryDetails,
  isValidEmail,
  isValidPhone,
  joinApartment,
  normalizeArgentinePostalCode,
  splitApartment,
} from "./address-fields.ts";

test("piso y departamento sobreviven guardar, editar y volver a guardar", () => {
  const original = { floor: "4", department: "B" };
  assert.deepEqual(splitApartment(joinApartment(original)), original);
  assert.equal(joinApartment(splitApartment("Piso 4, Departamento B")), "Piso 4, Departamento B");
});
test("conserva las direcciones antiguas y admite planta baja sin departamento", () => {
  assert.equal(joinApartment(splitApartment("Torre 2 / 3 B")), "Torre 2 / 3 B");
  assert.deepEqual(splitApartment("Piso PB"), { floor: "PB", department: "" });
  assert.deepEqual(splitApartment(null), { floor: "", department: "" });
});

test("exige piso y departamento para usar una dirección en el checkout", () => {
  assert.equal(hasRequiredDeliveryDetails({ floor: "4", department: "B" }), true);
  assert.equal(hasRequiredDeliveryDetails({ floor: "PB", department: "" }), false);
  assert.equal(hasRequiredDeliveryDetails({ floor: "", department: "2C" }), false);
});

test("convierte el CPA completo de CABA al código postal usado por cobertura", () => {
  assert.equal(normalizeArgentinePostalCode("C1425FQD"), "1425");
  assert.equal(normalizeArgentinePostalCode("c1000"), "1000");
  assert.equal(normalizeArgentinePostalCode("1425"), "1425");
});

test("valida correo y teléfono sin rechazar formatos habituales", () => {
  assert.equal(isValidEmail("persona@ejemplo.com.ar"), true);
  assert.equal(isValidEmail("persona@ejemplo"), false);
  assert.equal(isValidPhone("+54 9 11 1234-5678"), true);
  assert.equal(isValidPhone("11 1234-5678"), true);
  assert.equal(isValidPhone("11 ABC"), false);
  assert.equal(isValidPhone("1234"), false);
});
