import type { CartItem } from "@/domain/cart/types";
import type { OrderSummary } from "@/domain/customer/types";

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
  shippingEstimate: string | null;
  shippingCost: string;
  deliverySlotId?: string | null;
  deliverySlot?: DeliverySlot | null;
  deliverySlots?: DeliverySlot[];
  paymentMethod: "MERCADO_PAGO" | "PAYWAY" | null;
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
  active: boolean;
  displayOrder: number;
};

export type DeliverySlot = {
  id: string;
  date: string;
  label: string;
  from: string;
  to: string;
  timezone: string;
  available: boolean;
};

export type CheckoutCreateResult = {
  session: CheckoutSession;
  token?: string;
};

export type PaymentInitiationStatus =
  | "APPROVED"
  | "PENDING"
  | "PROCESSING"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CHARGED_BACK";

type CheckoutConfirmOrder = Omit<OrderSummary, "paymentStatus"> & {
  // Nest echoes the provider initiation status in this response. The later
  // Order query uses the persisted Order.paymentStatus contract.
  paymentStatus: OrderSummary["paymentStatus"] | PaymentInitiationStatus;
};

export type CheckoutConfirmResult = {
  order: CheckoutConfirmOrder;
  payment?: {
    provider: "mercadopago" | "payway" | "simulated";
    action: "REDIRECT" | "NONE" | "RETRY";
    paymentUrl: string | null;
    externalId: string | null;
    status: PaymentInitiationStatus;
    expiresAt: string | null;
  };
  publicToken?: string;
};
