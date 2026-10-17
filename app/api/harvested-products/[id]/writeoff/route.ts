import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/** Write off part of a finished-goods pool (administrator-only, enforced by the backend). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/harvested-products/${id}/writeoff`);
}
