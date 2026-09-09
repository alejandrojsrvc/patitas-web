export function formatKilograms(grams: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(grams / 1_000);
}

export function formatGrams(grams: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(Math.round(grams));
}

export function formatReplenishmentDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .toUpperCase();
}

export function formatConsumableQuantity(quantity: number, quantityLabel: string) {
  if (quantity !== 1) return `${quantity} ${quantityLabel}`;
  const singular = quantityLabel
    .replace(/^packs/, "pack")
    .replace(/^unidades/, "unidad")
    .replace(/^bolsas/, "bolsa");
  return `1 ${singular}`;
}
