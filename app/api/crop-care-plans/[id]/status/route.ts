import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/crop-care-plans/${id}/status`, "PATCH");
}
