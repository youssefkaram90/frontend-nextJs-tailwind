import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/** PATCH /api/sowing-plans/entries/:entryId/reopen — undo a manual close. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  return relayBody(request, `/sowing-plans/entries/${entryId}/reopen`, "PATCH");
}
