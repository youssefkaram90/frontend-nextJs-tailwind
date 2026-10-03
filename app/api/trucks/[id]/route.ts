import { NextRequest } from "next/server";
import { env } from "@/app/lib/env";

const BACKEND_URL = env.BACKEND_URL;
const BACKEND_TIMEOUT_MS = 10_000;

async function relay(request: NextRequest, id: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const cookie = request.headers.get("cookie") || "";
    const response = await fetch(`${BACKEND_URL}/trucks/${id}`, {
      ...init,
      headers: { "Content-Type": "application/json", Cookie: cookie },
      signal: controller.signal,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    const headers = new Headers();
    for (const c of response.headers.getSetCookie()) {
      headers.append("Set-Cookie", c);
    }
    headers.set("Content-Type", "application/json");

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(
        JSON.stringify({
          message: "The request took too long. Please try again.",
        }),
        { status: 504, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({
        message: "Could not reach the server. Check your connection.",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/** The truck with its shipments — the truck detail screen. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  return relay(request, id, { method: "PATCH", body: JSON.stringify(body) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return relay(request, id, { method: "DELETE" });
}
