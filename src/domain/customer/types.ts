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
  paymentStatus: string;
  subtotal: string;
  discountTotal: string;
  shippingCost: string;
  total: string;
  currency: "ARS";
  contactName: string;
  contactEmail: string;
  lines: Array<{
    variantId: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  createdAt: string;
};
