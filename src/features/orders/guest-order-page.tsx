"use client";

import { PaymentOrderView } from "@/features/orders/payment-order-view";

export function GuestOrderPage({ orderId }: { orderId: string }) {
  return <PaymentOrderView orderId={orderId} heading="Tu pedido" />;
}
