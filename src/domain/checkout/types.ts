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
  paymentMethod: "MERCADO_PAGO" | null;
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
  payment: {
    provider: "MERCADO_PAGO";
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXPIRED";
    redirectUrl: string | null;
  };
  publicToken?: string;
};
