import { NextRequest } from "next/server";
import { env } from "@/app/lib/env";

const BACKEND_URL = env.BACKEND_URL;

export async function POST(request: NextRequest) {
  const BACKEND_TIMEOUT_MS = 10_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const cookie = request.headers.get("cookie") || "";
    const response = await fetch(`${BACKEND_URL}/auth/logout-all`, {
      method: "POST",
      headers: { Cookie: cookie },
      signal: controller.signal,
    });

    const allCookies = response.headers.getSetCookie();

    const headers = new Headers();

    for (const cookie of allCookies) {
      headers.append("Set-Cookie", cookie);
    }

    return new Response(JSON.stringify(null), {
      status: response.status,
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Backend request time out" }),
        { status: 504, headers: { "Content-Type": "application/json" } },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}