import "server-only";

import { requestCommerce } from "@/infrastructure/api/commerce-api";

export async function mergeAnonymousCart(accessToken: string, cartToken: string) {
  try {
    const response = await requestCommerce("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ cartToken }),
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return false;
    const payload = await response.json().catch(() => null) as { cartMerged?: boolean } | null;
    return payload?.cartMerged === true;
  } catch {
    return false;
  }
}
