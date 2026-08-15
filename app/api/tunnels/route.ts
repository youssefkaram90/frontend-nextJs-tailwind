import { NextRequest } from "next/server";
import { env } from "@/app/lib/env";

const BACKEND_URL = env.BACKEND_URL;
const BACKEND_TIMEOUT_MS = 10_000;

async function proxy(
  request: NextRequest,
  path: string,
  init?: { method?: string; body?: string },
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const cookie = request.headers.get("cookie") || "";
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: init?.method ?? "GET",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: init?.body,
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

export async function GET(request: NextRequest) {
  return proxy(request, "/tunnels");
}
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxy(request, "/tunnels", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
