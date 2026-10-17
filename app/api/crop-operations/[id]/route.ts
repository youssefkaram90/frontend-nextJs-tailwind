import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/crop-operations/${id}`);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/crop-operations/${id}`, "DELETE");
}

/** PUT /api/crop-operations/:id — correct a logged operation (CROP-14). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/crop-operations/${id}`, "PUT");
}
