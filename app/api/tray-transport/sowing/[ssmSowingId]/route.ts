import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** GET /api/tray-transport/sowing/:ssmSowingId — one sowing's tray moves. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ssmSowingId: string }> },
) {
  const { ssmSowingId } = await params;
  return relay(request, `/tray-transport/sowing/${ssmSowingId}`);
}
