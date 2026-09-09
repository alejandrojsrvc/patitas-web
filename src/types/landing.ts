export type PetSpecies = "dog" | "cat";

export type Pet = {
  name: string;
  species: PetSpecies;
  description: string;
  weightKg: number;
};

export type ProductCategory = "food" | "hygiene" | "snack" | "accessory";

export type Product = {
  id: string;
  name: string;
  detail: string;
  category: ProductCategory;
  optional?: boolean;
};

export type SupplyPlan = {
  pet: Pet;
  frequency: "quincenal" | "mensual";
  nextDelivery: string;
  products: Product[];
};

export type Brand = {
  name: string;
};

export type FAQ = {
  question: string;
  answer: string;
};
