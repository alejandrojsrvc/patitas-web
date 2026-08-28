import { NextResponse } from "next/server";
import { catalogApi, PatitasApiError } from "@/infrastructure/api/patitas-api";
import type { ReplenishmentLeadInput } from "@/domain/catalog/types";

export async function POST(request: Request) {
  try {
    const input = await request.json() as ReplenishmentLeadInput;
    if (!input.productSlug || !input.variantId || !input.email || !input.consent?.email) {
      return NextResponse.json({ message: "Completá el alimento, la presentación y un email válido." }, { status: 400 });
    }
    return NextResponse.json(await catalogApi.captureReplenishmentLead(input));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No pudimos guardar tu aviso de reposición." },
      { status: error instanceof PatitasApiError ? error.status : 400 },
    );
  }
}
