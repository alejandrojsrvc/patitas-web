import type { ProductDetail } from "@/domain/catalog/types";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductBreadcrumbs } from "@/components/product/product-breadcrumbs";
import { ProductRelatedSection } from "@/components/product/product-related-section";
import { ProductStructuredData } from "@/components/product/product-structured-data";
import { ProductTechnicalInfo } from "@/components/product/product-technical-info";
import { productBreadcrumbs } from "@/lib/product-breadcrumbs";
import { ProductPurchaseView } from "./product-purchase-view";
import { ProductViewTracker } from "./product-view-tracker";

export function ProductScreen({ product }: { product: ProductDetail }) {
  const breadcrumbs = productBreadcrumbs(product);
  const relatedProducts = product.relatedProducts.slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main id="contenido" className="min-w-0 bg-catalog-page py-6 sm:py-10">
        <div className="container-shell">
          <ProductViewTracker slug={product.slug} />
          <ProductBreadcrumbs items={breadcrumbs} />
          <ProductStructuredData product={product} breadcrumbs={breadcrumbs} />
          <ProductPurchaseView product={product} />
          <ProductTechnicalInfo product={product} />
          <ProductRelatedSection product={product} products={relatedProducts} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
