import type { CartItem } from "@/domain/cart/types";
import type { OrderSummary } from "@/domain/customer/types";
import type { CustomerAddress } from "@/domain/customer/types";
import type { StorefrontShell } from "@/domain/storefront/types";

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
  deliveryInstructions: string | null;
  shippingOptionId: string | null;
  shippingZoneId: string | null;
  shippingEstimate: string | null;
  shippingCost: string;
  shippingDeliverySlot: string | null;
  shippingDeliveryDate: string | null;
  paymentMethod: "MERCADO_PAGO" | "PAYWAY" | "BANK_TRANSFER" | null;
  savedPaymentMethodId: string | null;
  couponCode: string | null;
  orderId: string | null;
  subtotal: string;
  discountTotal: string;
  total: string;
  pricing?: {
    productDiscountTotal: string;
    paymentDiscountTotal: string;
    shippingDiscountTotal: string;
    benefits: Array<{ type: string; origin?: string; description: string; amount: string; percentage?: string | null }>;
    conflicts: Array<{ code: string; message: string }>;
    shippingThreshold?: { threshold: string | null; eligibleAmount: string; remaining: string | null };
  };
  actions?: {
    coupon: { allowed: boolean; reasonCode: string | null; message: string | null };
    purchaseSchedule: { allowed: boolean; reasonCode: string | null; message: string | null };
  };
  scheduledPurchase?: {
    id: string;
    frequencyDays: number;
    discountPercent: string;
    leadDays: number;
    status: string;
  } | null;
  items: CartItem[];
  expiresAt: string;
};

export type ShippingOption = {
  id: string;
  cost: string;
  tariff: string;
  deliveryCount: number;
  zoneId?: string | null;
  zoneName?: string | null;
  available: boolean;
  message: string;
  reasonCode?: string | null;
  deliverySlots: DeliverySlot[];
  freeShippingFrom?: string | null;
  eligibleAmount?: string;
  remainingForFreeShipping?: string | null;
  benefit?: { type?: string; origin: string; description: string; amount: string } | null;
  estimate?: string | null;
};

export type CheckoutCustomerSummary = {
  fullName: string;
  email: string;
  phone: string | null;
};

export type DeliverySlot = {
  id: string;
  date: string;
  label: string;
  start: string;
  end: string;
};

export type AvailablePaymentMethod = {
  provider: "mercadopago" | "payway" | "manual_transfer";
  paymentMethod: "MERCADO_PAGO" | "PAYWAY" | "BANK_TRANSFER";
  priority: number;
  benefit?: { percentage: string; description: string };
  transfer?: { expirationMinutes: number; instructions: Record<string, string | null> };
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
    provider: "mercadopago" | "payway";
    action: "REDIRECT" | "NONE" | "RETRY";
    paymentUrl: string | null;
    externalId: string | null;
    status: PaymentInitiationStatus;
    expiresAt: string | null;
  };
  publicToken?: string;
  transfer?: {
    status: "PENDING" | "REPORTED" | "APPROVED" | "EXPIRED" | "REJECTED" | "CANCELLED";
    expectedAmount: string;
    currency: string;
    expiresAt: string | null;
    instructions: Record<string, string | null> | null;
  };
};

export type CheckoutMutationResult = {
  session: CheckoutSession;
  shippingOptions: ShippingOption[];
};

export type CheckoutScreen = CheckoutMutationResult & {
  shell: StorefrontShell;
  paymentMethods: AvailablePaymentMethod[];
  savedAddresses: CustomerAddress[];
  customer?: CheckoutCustomerSummary | null;
};

export type CheckoutConflict = {
  statusCode: 409;
  code: string;
  message: string;
  currentState?: CheckoutMutationResult;
};
