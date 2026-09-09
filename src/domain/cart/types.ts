export type CartItem = {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  slug: string;
  sku: string | null;
  presentation: string | null;
  imageUrl: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  availableQuantity: number;
  role: "MAIN" | "EXTRA";
  petId: string | null;
  planId: string | null;
};

export type CartItemContext = { role: "MAIN" | "EXTRA"; petId?: string | null; planId?: string | null };

export type Cart = {
  id: string;
  customerId: string | null;
  status: "ACTIVE" | "ABANDONED" | "CONVERTED" | "EXPIRED";
  currency: "ARS";
  subtotal: string;
  lastActivityAt: string | null;
  items: CartItem[];
  cartToken?: string;
};
