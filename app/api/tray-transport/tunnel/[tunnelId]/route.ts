import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

/** GET /api/tray-transport/tunnel/:tunnelId — what one tunnel is holding. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tunnelId: string }> },
) {
  const { tunnelId } = await params;
  return relay(request, `/tray-transport/tunnel/${tunnelId}`);
}
