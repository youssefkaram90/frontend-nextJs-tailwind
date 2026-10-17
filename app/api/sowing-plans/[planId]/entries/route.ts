import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/** GET /api/sowing-plans/:planId/entries — the lines inside one plan. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  return relay(request, `/sowing-plans/${planId}/entries`);
}

/**
 * POST /api/sowing-plans/:planId/entries — add one line to an existing plan.
 *
 * The backend route exists today and **nothing calls it**: the web's
 * `useAddPlanEntry` hook is defined and unused, and no phone screen offers it.
 * Once a plan is created, its lines can be deleted, closed or reopened — but
 * never added (SOW-08).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  return relayBody(request, `/sowing-plans/${planId}/entries`, "POST");
}
