import { NextRequest } from "next/server";
import { relay } from "@/app/lib/backend-relay";

export async function GET(request: NextRequest) {
  return relay(request, "/seasons/active");
}
