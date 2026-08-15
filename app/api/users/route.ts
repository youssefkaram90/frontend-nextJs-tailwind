import { NextRequest } from "next/server";
import { env } from "@/app/lib/env";

const BACKEND_URL = env.BACKEND_URL;
const BACKEND_TIMEOUT_MS = 10_000;

async function proxyRequest(
  request: NextRequest,
  backendPath: string,
  init?: { method?: string; body?: string },
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const cookie = request.headers.get("cookie") || "";

    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: init?.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: init?.body,
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

export async function GET(request: NextRequest) {
  return proxyRequest(request, "/users");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, "/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, "/users", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
