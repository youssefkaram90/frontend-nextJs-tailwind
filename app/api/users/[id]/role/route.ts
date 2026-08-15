import { NextRequest } from "next/server";
import { env } from "@/app/lib/env";

const BACKEND_URL = env.BACKEND_URL;
const BACKEND_TIMEOUT_MS = 10_000;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const cookie = request.headers.get("cookie") || "";

    const response = await fetch(`${BACKEND_URL}/users/${id}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
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
    headers.set("Content-Type", "application/json");

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(
        JSON.stringify({ message: "Backend request timed out" }),
        { status: 504, headers: { "Content-Type": "application/json" } },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
