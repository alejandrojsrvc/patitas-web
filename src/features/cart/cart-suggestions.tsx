import Link from "next/link";
import { ProductCarousel } from "@/components/catalog/product-carousel";
import { getProducts } from "@/infrastructure/api/patitas-api";

export async function CartSuggestions() {
  const result = await getProducts({ perPage: 8, sort: "featured" }).catch(() => null);
  if (!result) {
    return (
      <p className="mt-6 text-center text-sm text-muted">
        Podés explorar el{" "}
        <Link href="/perros" className="font-semibold text-brand-blue underline">
          catálogo completo
        </Link>{" "}
        para elegir tus productos.
      </p>
    );
  }
  return <ProductCarousel products={result.items} />;
}
