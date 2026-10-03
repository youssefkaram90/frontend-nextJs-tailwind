import { NextRequest } from "next/server";
import { env } from "@/app/lib/env";

const BACKEND_URL = env.BACKEND_URL;
const BACKEND_TIMEOUT_MS = 10_000;

/**
 * Forward one request to the backend and hand its answer straight back.
 *
 * Every route under `app/api/` needs the same four things — the caller's cookie,
 * a timeout, the backend's status, and its `Set-Cookie` headers — and this is now
 * the only copy of them (**X-09**). A new route is three lines.
 *
 * The wording of the two failures matters more than it looks: they are the only
 * messages a client ever sees that did **not** come from the backend, so they are
 * written to be read by the person using the app. The backend's own sentences
 * pass through untouched, which is why both clients show the same text.
 */
export async function relay(
  request: NextRequest,
  backendPath: string,
  init?: { method?: string; body?: unknown },
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const cookie = request.headers.get("cookie") || "";
    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: init?.method ?? "GET",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
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
      return errorResponse("The request took too long. Please try again.", 504);
    }
    return errorResponse(
      "Could not reach the server. Check your connection.",
      502,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * `relay` for the routes that carry a JSON body.
 *
 * A request with no body at all is normal — a `DELETE` has none — so an
 * unparseable body means "nothing to forward" rather than an error.
 */
export async function relayBody(
  request: NextRequest,
  backendPath: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE" = "POST",
) {
  const body = await request.json().catch(() => undefined);
  return relay(request, backendPath, { method, body });
}

/** A failure that never reached the backend, in the shape `api.ts` expects. */
function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
