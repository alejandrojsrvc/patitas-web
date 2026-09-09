import type { Cart } from "@/domain/cart/types";
import type {
  CustomerAddress,
  CustomerPet,
  CustomerProfile,
  OrderListItem,
  OrderSummary,
  ReplenishmentPlanSummary,
} from "@/domain/customer/types";

export type StorefrontViewer =
  | { authenticated: false }
  | {
      authenticated: true;
      id: string;
      email: string;
      displayName: string;
      role: string;
    };

export type StorefrontLocation = {
  label: string;
  street: string;
  number: string;
  apartment: string | null;
  neighborhood: string | null;
  city: string;
  province: string;
  postalCode: string;
};

export type StorefrontCartSummary = {
  id: string | null;
  itemCount: number;
  subtotal: string;
  currency: "ARS";
};

export type StorefrontShell = {
  viewer: StorefrontViewer;
  location: StorefrontLocation | null;
  cart: StorefrontCartSummary;
};

export type CartScreen = {
  shell: StorefrontShell;
  cart: Cart | null;
};

export type AccountOverviewSection = {
  type: "overview";
  orderCount: number;
  recentOrders: OrderListItem[];
};

export type AccountOrdersSection = {
  type: "orders";
  orders: OrderListItem[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

export type AccountSectionData =
  | AccountOverviewSection
  | AccountOrdersSection
  | { type: "order-detail"; order: OrderSummary }
  | { type: "addresses"; addresses: CustomerAddress[] }
  | { type: "pets"; pets: CustomerPet[] }
  | { type: "replenishments"; replenishments: ReplenishmentPlanSummary[] };

export type AccountScreen = {
  shell: StorefrontShell;
  profile: CustomerProfile;
  section: AccountSectionData;
};

export type ApiAccountSection = "overview" | "orders" | "addresses" | "pets" | "replenishments";

export type ServerBootstrapResult<T> = {
  data: T | null;
  refreshRequired: boolean;
  error: string | null;
};

export const emptyStorefrontShell: StorefrontShell = {
  viewer: { authenticated: false },
  location: null,
  cart: {
    id: null,
    itemCount: 0,
    subtotal: "0.00",
    currency: "ARS",
  },
};
