import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * PATCH /api/sowing-plans/entries/:entryId/close — an administrator closes a
 * line that will not reach its planned figure.
 *
 * `assertEntrySowable` then refuses to sow against it, which is the point; the
 * action can be undone from the same screen (reopen).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  return relayBody(request, `/sowing-plans/entries/${entryId}/close`, "PATCH");
}
