import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/** Execute one planned treatment — the operation it records is created by the backend. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  return relayBody(request, `/crop-care-plans/entries/${entryId}/execute`);
}
