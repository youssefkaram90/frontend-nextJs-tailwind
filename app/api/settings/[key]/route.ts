import { NextRequest } from "next/server";
import { relayBody } from "@/app/lib/backend-relay";

/**
 * PATCH /api/settings/:key — store one figure.
 *
 * ADMIN only on the server (`AdminOnlyGuard`, never a grantable permission), so a
 * non-admin's attempt comes back as the server's own sentence and reaches the user
 * through `relayBody` unchanged — rather than appearing to succeed.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  return relayBody(request, `/settings/${key}`, "PATCH");
}
