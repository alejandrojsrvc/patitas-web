"use client";

import { useEffect } from "react";

export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void fetch(`/api/commerce/products/${encodeURIComponent(slug)}/view`, { method: "POST" });
  }, [slug]);

  return null;
}
