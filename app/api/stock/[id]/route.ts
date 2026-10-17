import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** GET /api/stock/:id — one lot, with its movements and its season. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/stock/${id}`);
}
