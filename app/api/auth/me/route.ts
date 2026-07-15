import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  const response = await fetch(`${BACKEND_URL}/me`, {
    headers: { Cookie: cookie },
  });

  const data = await response.json();

  return Response.json(data, { status: response.status });
}
