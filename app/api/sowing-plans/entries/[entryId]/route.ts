import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * PATCH /api/sowing-plans/entries/:entryId — correct a plan line.
 *
 * The backend route was repaired on purpose (the status and the executed
 * counters were not recalculated after an edit, and an SSM entry patched with the
 * LPM shape of the body ended up with `plannedTrays = null` and could never reach
 * EXECUTED) — yet **no client calls it**, in either app. Until SOW-08 is built,
 * a wrong variety or an extra line can only be fixed by deleting the plan and
 * creating it again.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  return relayBody(request, `/sowing-plans/entries/${entryId}`, "PATCH");
}

/** DELETE /api/sowing-plans/entries/:entryId — remove one line from a plan. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  return relayBody(request, `/sowing-plans/entries/${entryId}`, "DELETE");
}
