import { NextRequest } from "next/server";
import { env } from "@/app/lib/env";

const BACKEND_URL = env.BACKEND_URL;
const BACKEND_TIMEOUT_MS = 10_000;

export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const cookie = request.headers.get("cookie") || "";
    // Forward the query string so ?q= and ?stage= reach the backend
    const path = `/plant-stock${request.nextUrl.search}`;
    const response = await fetch(`${BACKEND_URL}${path}`, {
      headers: { "Content-Type": "application/json", Cookie: cookie },
      signal: controller.signal,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    const headers = new Headers();
    for (const c of response.headers.getSetCookie())
      headers.append("Set-Cookie", c);
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
