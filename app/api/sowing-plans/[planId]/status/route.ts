import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * PATCH /api/sowing-plans/:planId/status — declare a plan COMPLETED (or put it
 * back).
 *
 * The status is what `assertEntrySowable` reads, so a plan marked complete
 * refuses further sowings; a rejected status must therefore keep the backend's
 * own sentence instead of blaming the connection (SPLAN-02 impact).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  return relayBody(request, `/sowing-plans/${planId}/status`, "PATCH");
}
