import { NextRequest } from "next/server";
import { relay, relayBody } from "@/app/lib/backend-relay";

/** GET /api/permissions/users/:userId — the permissions one user holds. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return relay(request, `/permissions/users/${userId}`);
}

/** POST /api/permissions/users/:userId — replace them (ADMIN only). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  return relayBody(request, `/permissions/users/${userId}`, "POST");
}
