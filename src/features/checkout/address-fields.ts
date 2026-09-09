// The API stores floor and department together in `apartment`.
// Preserve legacy free text, while allowing our structured values to be edited.
export function splitApartment(apartment: string | null | undefined) {
  const value = apartment?.trim() ?? "";
  const match = value.match(/^Piso ([^,]+)(?:, Departamento (.+))?$/u);
  return match ? { floor: match[1], department: match[2] ?? "" } : { floor: "", department: value };
}

export function joinApartment(address: { floor: string; department: string }) {
  const floor = address.floor.trim();
  const department = address.department.trim();
  if (!floor) return department;
  return `Piso ${floor}${department ? `, Departamento ${department}` : ""}`;
}

export function hasRequiredDeliveryDetails(address: { floor: string; department: string }) {
  return Boolean(address.floor.trim() && address.department.trim());
}

export function normalizeArgentinePostalCode(postalCode: string | null | undefined) {
  const value = postalCode?.trim().toUpperCase() ?? "";
  const cpaMatch = value.match(/^C?(\d{4})(?:[A-Z]{3})?$/u);
  return cpaMatch?.[1] ?? value;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email.trim());
}

export function isValidPhone(phone: string) {
  const value = phone.trim();
  if (!value || !/^[+\d\s().-]+$/u.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
