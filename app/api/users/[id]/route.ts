import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** GET /api/users/:id — one user, with their permission names. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, `/users/${id}`);
}
