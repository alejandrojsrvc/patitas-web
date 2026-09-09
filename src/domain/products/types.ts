export type Species = "dog" | "cat";

export type LifeStage = "adult" | "puppy" | "kitten" | "senior";

export type BreedSize = "small" | "medium" | "large" | "medium_large" | "all";

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string | null;
  weightGrams: number | null;
  enabled: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  line: string | null;
  species: Species | null;
  lifeStage: LifeStage | null;
  breedSize: BreedSize | null;
  estimatedDailyGramsPerKg: number | null;
  enabled: boolean;
  variants: ProductVariant[];
};

export type ProductFilters = {
  species?: Species;
  brand?: string;
  enabled?: boolean;
};
