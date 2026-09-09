import { NextResponse } from "next/server";
import { catalogApi, PatitasApiError } from "@/infrastructure/api/patitas-api";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      productId: string;
      variantId: string;
      petWeightKg: number;
      species: string;
      lifeStage: string;
    };
    return NextResponse.json(
      await catalogApi.createReplenishmentEstimate({
        pet: { name: "Tu mascota", species: input.species, weightKg: input.petWeightKg, lifeStage: input.lifeStage },
        food: { productId: input.productId, variantId: input.variantId },
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No pudimos calcular la duración." },
      { status: error instanceof PatitasApiError ? error.status : 400 },
    );
  }
}
