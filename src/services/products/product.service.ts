import type { ProductRepository } from "@/domain/products/product.repository";
import type { Product, ProductFilters } from "@/domain/products/types";
import type { FoodBrand, FoodLine, FoodPresentation } from "@/features/build-plan/types";

function formatWeight(grams: number): string {
  if (grams < 1000) return `${grams} g`;
  const kg = grams / 1000;
  const label = kg % 1 === 0 ? `${kg}` : kg.toLocaleString("es-AR");
  return `${label} kg`;
}

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  findProducts(filters?: ProductFilters): Promise<Product[]> {
    return this.repository.findProducts(filters);
  }

  findProductById(id: string): Promise<Product | null> {
    return this.repository.findProductById(id);
  }

  productsToFoodBrands(products: Product[]): FoodBrand[] {
    const enabledProducts = products.filter((p) => p.enabled);
    const brandMap = new Map<string, Product[]>();

    for (const product of enabledProducts) {
      const existing = brandMap.get(product.brand) ?? [];
      existing.push(product);
      brandMap.set(product.brand, existing);
    }

    const brands: FoodBrand[] = [];

    for (const [brandName, brandProducts] of brandMap) {
      const firstProduct = brandProducts[0];
      const lines: FoodLine[] = brandProducts.map((product) => ({
        id: product.id,
        name: product.line ?? product.name,
        mockDailyGramsPerKg: product.estimatedDailyGramsPerKg ?? undefined,
        presentations: product.variants
          .filter((v) => v.enabled && v.weightGrams != null)
          .map(
            (variant): FoodPresentation => ({
              id: variant.id,
              label: formatWeight(variant.weightGrams!),
              grams: variant.weightGrams!,
            }),
          ),
      }));

      brands.push({
        id: brandName,
        name: brandName,
        species: firstProduct.species!,
        lines,
      });
    }

    return brands;
  }
}
