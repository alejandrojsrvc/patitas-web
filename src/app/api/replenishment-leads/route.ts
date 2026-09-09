import { NextResponse } from "next/server";
import { catalogApi, PatitasApiError } from "@/infrastructure/api/patitas-api";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      estimateId?: string;
      email?: string;
      consent?: boolean;
      consentVersion?: string;
      token?: string;
    };
    if (!input.estimateId || !input.email || !input.consent || !input.consentVersion) {
      return NextResponse.json({ message: "Completá el alimento, la presentación y un email válido." }, { status: 400 });
    }
    return NextResponse.json(
      await catalogApi.createReplenishmentReminder(
        { estimateId: input.estimateId, email: input.email, consent: input.consent, consentVersion: input.consentVersion },
        input.token,
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No pudimos guardar tu aviso de reposición." },
      { status: error instanceof PatitasApiError ? error.status : 400 },
    );
  }
}
