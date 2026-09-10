export type CatalogSpecies = "DOG" | "CAT";
export type ProductCategory = "FOOD" | "SNACK" | "HYGIENE";
export type FoodType = "DRY" | "WET";
export type LifeStage = "PUPPY" | "ADULT" | "SENIOR";
export type CatalogAvailability = "AVAILABLE" | "OUT_OF_STOCK";
export type FulfillmentAvailability = "TODAY" | "TOMORROW" | "LATER" | "OUT_OF_STOCK";

export type CatalogReference = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type Category = CatalogReference & {
  parentId: string | null;
  children: Category[];
};

export type Brand = CatalogReference & {
  logoUrl: string | null;
};

export type ProductMedia = {
  url: string;
  altText: string;
  variantId: string | null;
};

export type ProductVariant = {
  id: string;
  sku: string;
  presentation: string | null;
  weightGrams: number | null;
  salePrice: string;
  compareAtPrice: string | null;
  currency: "ARS";
  fulfillment: {
    purchasable: boolean;
    availability: FulfillmentAvailability;
    label: string;
    availableQuantity: number;
    orderBefore: string | null;
    deliveryDate: string | null;
  };
};

export type ProductOffer = {
  id: string;
  name: string;
  type: string;
  value: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  line: string | null;
  species: CatalogSpecies | null;
  lifeStage: LifeStage | null;
  breedSize: string | null;
  brand: Brand;
  category: CatalogReference | null;
  classification: { category: ProductCategory | null; foodType: FoodType | null };
  media: ProductMedia[];
  variants: ProductVariant[];
  offers: ProductOffer[];
};

export type PublicOffer = ProductOffer & {
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
  targets: Array<{ productId: string | null; variantId: string | null; categoryId: string | null; brandId: string | null }>;
};

export type ReplenishmentEstimate = {
  id: string;
  accessToken?: string;
  dailyGrams: { min: number; max: number };
  durationDays: { min: number; max: number };
  source: string;
  sourceLabel: string;
  sourceUrl: string | null;
  estimatedDepletionDate: string;
  assumptions: string[];
  productId: string | null;
  variantId: string | null;
  custom: { brand: string; name: string; weightGrams: number } | null;
};

export type ProductTechnicalSheet = {
  species: CatalogSpecies | null;
  lifeStage: string | null;
  breedSize: string | null;
  line: string | null;
  estimatedDailyGramsPerKg: string | null;
  feedingGuide: {
    sourceLabel: string;
    sourceUrl: string | null;
    requiredDimensions: Record<string, string[]>;
    entries: Array<{
      petWeightKg: number;
      lifeStage: string | null;
      conditions: Record<string, string>;
      dailyGramsMin: number;
      dailyGramsMax: number;
    }>;
  } | null;
};

export type ProductDetail = Product & {
  technicalSheet: ProductTechnicalSheet;
  relatedProducts: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    brand: Brand;
    category: CatalogReference | null;
    imageUrl: string | null;
    startingPrice: string;
  }>;
};

export type ProductPage = {
  items: Product[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

export type ProductAutocompleteItem = {
  id: string;
  productId: string;
  slug: string;
  species: CatalogSpecies | null;
  categorySlug: string;
  name: string;
  presentation: string | null;
  displayName: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  image: {
    url: string;
    altText: string;
  } | null;
  salePrice: string;
  currency: "ARS";
};

export type ProductAutocompleteResponse = {
  items: ProductAutocompleteItem[];
};

export type StringFacetOption = {
  value: string;
  label: string;
  count: number;
};

export type BrandFacetOption = StringFacetOption & {
  logoUrl: string | null;
};

export type CategoryFacetOption = StringFacetOption & {
  species: string[];
  children: CategoryFacetOption[];
};

export type WeightFacetOption = {
  value: number;
  label: string;
  count: number;
};

export type ProductFacets = {
  brands: BrandFacetOption[];
  categories: CategoryFacetOption[];
  foodTypes: CategoryFacetOption[];
  subcategories: CategoryFacetOption[];
  lifeStages: StringFacetOption[];
  weights: WeightFacetOption[];
  availability: StringFacetOption[];
};

export type CalculatorProductProjection = {
  id: string;
  name: string;
  slug: string;
  species: CatalogSpecies | null;
  lifeStage: string | null;
  estimatedDailyGramsPerKg: string | null;
  variants: Array<{
    id: string;
    presentation: string | null;
    weightGrams: number | null;
  }>;
};

export type SitemapProductProjection = {
  slug: string;
  updatedAt: string;
};

export type ProductFilters = {
  q?: string;
  species?: CatalogSpecies;
  category?: ProductCategory;
  foodType?: FoodType;
  categorySlug?: string;
  brand?: string[];
  lifeStage?: LifeStage[];
  weightGrams?: number[];
  minPrice?: string;
  maxPrice?: string;
  availability?: CatalogAvailability;
  featured?: boolean;
  sort?: "featured" | "name_asc" | "price_asc" | "price_desc";
  page?: number;
  perPage?: number;
};

export type CatalogBreadcrumb = { label: string; href: string };
export type CatalogLandingFilters = Omit<Partial<ProductFilters>, "brand" | "lifeStage"> & {
  brand?: string;
  lifeStage?: LifeStage;
};

export type CatalogLanding = {
  kind: "LANDING";
  landingType: "CATALOG" | "BRAND_INDEX" | "BRAND";
  filters: CatalogLandingFilters;
  seo: {
    title: string;
    h1: string;
    description: string;
    canonical: string;
    robots: { index: true; follow: true };
  };
  breadcrumbs: CatalogBreadcrumb[];
};

export type CatalogPathResolution = CatalogLanding | { kind: "REDIRECT"; statusCode: 308; destination: string };
export type CatalogLandingManifest = { items: CatalogLanding[] };

export type FoodDurationResult = {
  source: "MANUFACTURER" | "GENERAL_FALLBACK";
  sourceLabel: string;
  sourceUrl: string | null;
  isFallback: boolean;
  dailyGrams: { min: number; max: number };
  durationDays: { min: number; max: number };
  assumptions: string[];
};
