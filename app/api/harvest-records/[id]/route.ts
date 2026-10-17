import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/harvest-records/${id}`);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/harvest-records/${id}`, "DELETE");
}
