import type { CartItem } from "@/domain/cart/types";

export type CheckoutSession = {
  id: string;
  cartId: string;
  customerId: string | null;
  stage: "CONTACT" | "SHIPPING" | "PAYMENT" | "CONFIRMATION";
  status: "DRAFT" | "COMPLETED" | "EXPIRED" | "CANCELLED";
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  shippingAddress: Record<string, string> | null;
  shippingOptionId: string | null;
  shippingCost: string;
  paymentMethod: "SIMULATED_CARD" | "SIMULATED_TRANSFER" | "SIMULATED_CASH" | null;
  couponCode: string | null;
  orderId: string | null;
  subtotal: string;
  discountTotal: string;
  total: string;
  items: CartItem[];
  expiresAt: string;
};

export type ShippingOption = {
  id: string;
  name: string;
  description?: string | null;
  cost: string;
  estimatedDays?: number | null;
};

export type CheckoutCreateResult = {
  session: CheckoutSession;
  token?: string;
};

export type CheckoutConfirmResult = {
  order: import("@/domain/customer/types").OrderSummary;
  publicToken?: string;
};
