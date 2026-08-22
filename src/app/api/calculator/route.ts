import { NextResponse } from "next/server";
import { catalogApi, PatitasApiError } from "@/infrastructure/api/patitas-api";

export async function POST(request: Request) {
  try {
    const input = await request.json() as {
      productSlug: string; variantId: string; petWeightKg: number;
      lifeStage?: string; attributes?: Record<string, string>;
    };
    return NextResponse.json(await catalogApi.calculateFoodDuration(input));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No pudimos calcular la duración." },
      { status: error instanceof PatitasApiError ? error.status : 400 },
    );
  }
}
