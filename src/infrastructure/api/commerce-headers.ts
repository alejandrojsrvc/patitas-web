export function buildCommerceHeaders(input: {
  path: string;
  accessToken?: string | null;
  cartToken?: string;
  checkoutToken?: string;
  orderToken?: string;
  visitorId: string;
  idempotencyKey?: string;
}) {
  const headers: Record<string, string> = { "X-Visitor-Id": input.visitorId };
  if (input.accessToken) headers.Authorization = `Bearer ${input.accessToken}`;
  if (!input.accessToken && input.cartToken && (input.path === "/cart" || input.path.startsWith("/cart/items/") || input.path === "/checkout/sessions")) headers["X-Cart-Token"] = input.cartToken;
  if (!input.accessToken && input.checkoutToken && input.path.startsWith("/checkout/sessions/")) headers["X-Checkout-Token"] = input.checkoutToken;
  if (input.orderToken && (input.path.startsWith("/checkout/orders/") || input.path.startsWith("/payments/orders/"))) headers["X-Order-Token"] = input.orderToken;
  if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;
  return headers;
}
