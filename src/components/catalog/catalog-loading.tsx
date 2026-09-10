import { CatalogHeaderSkeleton, CatalogLoadingContent } from "./catalog-loading-content";

export function CatalogLoading({ title, description }: { title?: string; description?: string } = {}) {
  return (
    <>
      <CatalogHeaderSkeleton />
      <CatalogLoadingContent title={title} description={description} />
    </>
  );
}
