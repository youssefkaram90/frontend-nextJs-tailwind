import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/** GET /api/sowing-plans/:planId — one plan, with its entries. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  return relay(request, `/sowing-plans/${planId}`);
}

/**
 * DELETE /api/sowing-plans/:planId — delete a plan.
 *
 * A `PATCH` used to be exported here too, forwarding to `/sowing-plans/{id}`,
 * which is **not** a backend route: the backend offers `PATCH :id/status` and
 * `PATCH entries/:entryId` only. Nothing called it, so it is gone rather than
 * re-written. A future "edit the plan header" feature needs the backend route
 * first (SOW-06).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  return relayBody(request, `/sowing-plans/${planId}`, "DELETE");
}
