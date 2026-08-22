import type { Product, ProductFilters } from "./types";

export interface ProductRepository {
  findProducts(filters?: ProductFilters): Promise<Product[]>;
  findProductById(id: string): Promise<Product | null>;
}
