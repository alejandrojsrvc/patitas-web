export type CustomerProfile = {
  id: string;
  userId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerProfileInput = {
  fullName?: string;
  phone?: string | null;
};

export type CustomerAddress = {
  id: string;
  customerId: string;
  label: string;
  recipientName: string;
  phone: string | null;
  street: string;
  number: string;
  apartment: string | null;
  neighborhood: string | null;
  city: string;
  province: string;
  postalCode: string;
  reference: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAddressInput = {
  label: string;
  recipientName: string;
  phone?: string | null;
  street: string;
  number: string;
  apartment?: string | null;
  neighborhood?: string | null;
  city: string;
  province: string;
  postalCode: string;
  reference?: string | null;
  isDefault?: boolean;
};

export type OrderSummary = {
  id: string;
  number?: string | null;
  status: string;
  paymentStatus: "UNPAID" | "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "PARTIALLY_REFUNDED" | "REFUNDED" | "CHARGED_BACK";
  canRetry: boolean;
  reconciliationRequired: boolean;
  reconciliationReason: string | null;
  reservationExpiresAt: string | null;
  subtotal: string;
  discountTotal: string;
  shippingCost: string;
  total: string;
  currency: "ARS";
  contactName: string;
  contactEmail: string;
  petName: string | null;
  date: string;
  lines: Array<{
    variantId: string;
    productName: string;
    presentation: string | null;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  shippingAddress?: Record<string, unknown>;
  deliveryInstructions?: string | null;
  shippingEstimate?: string | null;
  shippingDeliveryDate?: string | null;
  shippingDeliverySlot?: string | null;
  trackingNumber?: string | null;
  payments?: Array<{ id: string; amount: string; currency: string; method: string; provider: string | null; externalPaymentId: string | null; paidAt: string | null; createdAt: string }>;
  statusEvents?: Array<{ id: string; status: string; occurredAt: string }>;
  shipment?: { id: string; status: string; carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; estimatedDate: string | null; estimatedSlot: string | null; events: Array<{ id: string; status: string; visibleMessage: string; occurredAt: string }> } | null;
  createdAt: string;
};

export type OrderListItem = {
  id: string;
  number: string | null;
  status: string;
  paymentStatus: OrderSummary["paymentStatus"];
  total: string;
  currency: "ARS";
  lineCount: number;
  createdAt: string;
};

export type CustomerPet = {
  id: string;
  customerId: string;
  name: string;
  species: "dog" | "cat";
  weightKg: string;
  lifeStage: "puppy" | "adult" | "senior";
  breed: string | null;
  currentFood: {
    source: "catalog" | "custom";
    productId: string | null;
    variantId: string | null;
    brand: string;
    name: string;
    weightGrams: number | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type PetCurrentFoodInput =
  | { source: "catalog"; productId: string; variantId: string }
  | { source: "custom"; brand: string; name: string; weightGrams: number }
  | { source: "none" };

export type CustomerPetInput = Pick<CustomerPet, "name" | "species" | "weightKg" | "lifeStage" | "breed">;

export type ReplenishmentPlanSummary = {
  id: string;
  petName: string;
  productName: string | null;
  presentation: string | null;
  status: string;
  estimatedDepletionDate: string;
  nextReminderAt: string | null;
  remindersEnabled: boolean;
};
