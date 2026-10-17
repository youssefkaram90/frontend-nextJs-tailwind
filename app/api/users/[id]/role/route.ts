import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/** PATCH /api/users/:id/role — change a user's role (ADMIN only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relayBody(request, `/users/${id}/role`, "PATCH");
}
