import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * Delete one plant count (PSTOCK-10).
 *
 * The path carries the COUNT's id, not the batch's — the same shape the backend
 * uses, so neither side has to look anything up twice. A `DELETE` has no body,
 * which `relayBody` treats as normal.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ countId: string }> },
) {
  const { countId } = await params;
  return relayBody(request, `/plant-stock/counts/${countId}`, "DELETE");
}
