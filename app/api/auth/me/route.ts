import { NextRequest } from "next/server";
import { env } from "@/app/lib/env";

const BACKEND_URL = env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const BACKEND_TIMEOUT_MS = 10_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const cookie = request.headers.get("cookie") || "";
    const response = await fetch(`${BACKEND_URL}/me`, {
      headers: { Cookie: cookie },
      signal: controller.signal,
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Backend request time out " }),
        { status: 504, headers: { "Content-Type": "applicaton/json" } },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
