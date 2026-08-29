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
  city: string;
  province: string;
  postalCode: string;
  reference?: string | null;
  isDefault?: boolean;
};

export type OrderSummary = {
  id: string;
  status: string;
  paymentStatus:
    | "UNPAID"
    | "PENDING"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "PARTIALLY_REFUNDED"
    | "REFUNDED"
    | "CHARGED_BACK";
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
  createdAt: string;
  updatedAt: string;
};

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
