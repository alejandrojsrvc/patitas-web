import type { ApiAccountSection } from "@/domain/storefront/types";

export type AccountSection = "resumen" | "pedidos" | "direcciones" | "mascotas" | "reposiciones";

export type AccountRequest = {
  section: ApiAccountSection;
  orderId?: string;
  page?: number;
  perPage?: number;
};

const accountSectionMap: Record<AccountSection, ApiAccountSection> = {
  resumen: "overview",
  pedidos: "orders",
  direcciones: "addresses",
  mascotas: "pets",
  reposiciones: "replenishments",
};

const routeSections: AccountSection[] = ["resumen", "pedidos", "direcciones", "mascotas", "reposiciones"];

export function resolveAccountRoute(segments: string[], page = 1) {
  const section = routeSections.includes(segments[0] as AccountSection) ? (segments[0] as AccountSection) : "resumen";
  const apiSection = accountSectionMap[section];
  const hasOrderDetail = section === "pedidos" && Boolean(segments[1]);

  return {
    section,
    request: {
      section: apiSection,
      orderId: hasOrderDetail ? segments[1] : undefined,
      page: apiSection === "orders" && !hasOrderDetail ? page : undefined,
      perPage: apiSection === "orders" && !hasOrderDetail ? 10 : undefined,
    } satisfies AccountRequest,
  };
}

export function accountRequestKey(request: AccountRequest) {
  if (request.orderId) return `${request.section}:order:${request.orderId}`;
  if (request.section === "orders") return `${request.section}:page:${request.page ?? 1}:per-page:${request.perPage ?? 10}`;
  return request.section;
}

export function accountSectionFromPathname(pathname: string): AccountSection {
  const section = pathname.split("/").filter(Boolean)[1];
  return routeSections.includes(section as AccountSection) ? (section as AccountSection) : "resumen";
}
