import type { ProductVariant } from "@/domain/catalog/types";

const DELIVERY_TIME_ZONE = "America/Argentina/Buenos_Aires";
const DELIVERY_CUTOFF_HOUR = 13;
const MAX_PRODUCT_QUANTITY = 5;

type LocalDate = { year: number; month: number; day: number };

export type ProductDeliveryEstimate = {
  cutoffAt: string;
  cutoffLabel: string;
  deliveryDate: string;
  deliveryLabel: string;
  remainingSeconds: number;
};

export function resolvedAvailableQuantity(variant: ProductVariant) {
  if (!variant.fulfillment.purchasable) return 0;
  if (Number.isFinite(variant.fulfillment.availableQuantity)) {
    return Math.max(0, Math.floor(variant.fulfillment.availableQuantity));
  }
  return 0;
}

export function productQuantityOptions(availableQuantity: number) {
  return Array.from({ length: Math.min(MAX_PRODUCT_QUANTITY, Math.max(0, availableQuantity)) }, (_, index) => index + 1);
}

export function productDeliveryEstimate(now: Date): ProductDeliveryEstimate {
  const parts = buenosAiresParts(now);
  const today = { year: parts.year, month: parts.month, day: parts.day };
  const beforeCutoff = parts.hour < DELIVERY_CUTOFF_HOUR;
  const cutoffDate = isBusinessDay(today) && beforeCutoff ? today : nextBusinessDay(today);
  const deliveryDate = nextBusinessDay(cutoffDate);
  const cutoffAt = new Date(`${dateKey(cutoffDate)}T${String(DELIVERY_CUTOFF_HOUR).padStart(2, "0")}:00:00-03:00`);
  const tomorrow = addDays(today, 1);

  return {
    cutoffAt: cutoffAt.toISOString(),
    cutoffLabel:
      dateKey(cutoffDate) === dateKey(today)
        ? `Pedilo antes de las ${DELIVERY_CUTOFF_HOUR}:00`
        : `Pedilo antes del ${formatWeekday(cutoffDate)} a las ${DELIVERY_CUTOFF_HOUR}:00`,
    deliveryDate: dateKey(deliveryDate),
    deliveryLabel: dateKey(deliveryDate) === dateKey(tomorrow) ? "Llega mañana" : `Llega el ${formatDeliveryDate(deliveryDate)}`,
    remainingSeconds: Math.max(0, Math.floor((cutoffAt.getTime() - now.getTime()) / 1000)),
  };
}

export function formatDeliveryCountdown(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":");
}

function buenosAiresParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DELIVERY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour") };
}

function nextBusinessDay(date: LocalDate) {
  let candidate = addDays(date, 1);
  while (!isBusinessDay(candidate)) candidate = addDays(candidate, 1);
  return candidate;
}

function isBusinessDay(date: LocalDate) {
  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

function addDays(date: LocalDate, days: number): LocalDate {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

function dateKey(date: LocalDate) {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function formatDeliveryDate(date: LocalDate) {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(value);
}

function formatWeekday(date: LocalDate) {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "UTC" }).format(value);
}
