import { NextRequest } from "next/server";
import { env } from "@/app/lib/env";

const BACKEND_URL = env.BACKEND_URL;

export async function POST(request: NextRequest) {
  const BACKEND_TIMEOUT_MS = 10_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    const allCookies = response.headers.getSetCookie();

    const headers = new Headers();

    for (const cookie of allCookies) {
      headers.append("Set-Cookie", cookie);
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(
        JSON.stringify({ message: "Backend request time out " }),
        { status: 504, headers: { "Content-Type": "application/json" } },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
