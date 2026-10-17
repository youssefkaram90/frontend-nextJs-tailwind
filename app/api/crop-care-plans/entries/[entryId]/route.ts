import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  return relayBody(request, `/crop-care-plans/entries/${entryId}`, "DELETE");
}
