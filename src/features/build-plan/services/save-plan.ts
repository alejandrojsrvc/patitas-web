import type { LeadCapturePayload } from "../types";

export async function savePlanMock(payload: LeadCapturePayload) {
  // Replace this delay with the patitas-api request when capture is enabled.
  void payload;
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { success: true as const };
}
