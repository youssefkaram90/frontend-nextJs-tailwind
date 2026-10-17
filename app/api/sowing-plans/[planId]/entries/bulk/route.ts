import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * POST /api/sowing-plans/:planId/entries/bulk — add several lines at once.
 *
 * Kept, although nothing calls it yet: the backend says the same thing in its own
 * comment (*"no client calls this route today"*, SPLAN-05). It is the natural fit
 * for the missing "add a line" screen and for any repeat of the Excel import
 * (SOW-08).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> },
) {
  const { planId } = await params;
  return relayBody(request, `/sowing-plans/${planId}/entries/bulk`, "POST");
}
