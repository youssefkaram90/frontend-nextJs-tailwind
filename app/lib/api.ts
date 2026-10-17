const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim();
export const AUTH_EXPIRED_EVENT = "auth-expired";
export const PERMISSIONS_STALE_EVENT = "permissions-stale";

let lastPermissionsStaleAt = 0;

/**
 * A 403 almost always means the user's permissions changed since the UI was
 * rendered. Tell the app to refresh the cached user so it stops offering
 * actions the server now rejects. Debounced — one page can fire several 403s.
 */
function notifyPermissionsStale() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastPermissionsStaleAt < 5_000) return;
  lastPermissionsStaleAt = now;
  window.dispatchEvent(new Event(PERMISSIONS_STALE_EVENT));
}

export class AuthExpiredError extends Error {
  constructor(message = "Session expired. Please sign in again.") {
    super(message);
    this.name = "AuthExpiredError";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<RefreshResult> | null = null;

type RefreshResult = "success" | "auth-failed" | "failed";

function isAuthFailureStatus(status: number) {
  return status === 400 || status === 401 || status === 403;
}

function redirectToSignin() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));

  if (window.location.pathname.startsWith("/signin")) return;

  const next = `${window.location.pathname}${window.location.search}`;
  window.location.replace(`/signin?next=${encodeURIComponent(next)}`);
}

async function attemptRefresh(): Promise<RefreshResult> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });
      if (response.ok) return "success";
      return isAuthFailureStatus(response.status) ? "auth-failed" : "failed";
    } catch {
      return "failed";
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * `fetch` that answers a connection failure in plain language.
 *
 * A network failure — offline, or the server not running — rejects with the
 * browser's own `TypeError: Failed to fetch`. That is a developer string, and it
 * is the one failure where no server-written sentence can exist, so it is
 * translated here, once. The wording matches `app/lib/backend-relay.ts`, so the
 * client and the proxy routes say the same thing.
 */
async function send(url: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The request took too long. Please try again.");
    }
    throw new Error("Could not reach the server. Check your connection.");
  }
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("/api/") ? endpoint : `${API_URL}${endpoint}`;
  let response = await send(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401 && !endpoint.startsWith("/api/auth/")) {
    const refreshed = await attemptRefresh();
    if (refreshed === "success") {
      response = await send(url, {
        ...options,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    } else if (refreshed === "auth-failed") {
      redirectToSignin();
      throw new AuthExpiredError();
    } else {
      throw new Error("Could not refresh session. Please try again.");
    }
  }

  if (response.status === 401 && !endpoint.startsWith("/api/auth/")) {
    redirectToSignin();
    throw new AuthExpiredError();
  }

  if (response.status === 403) {
    notifyPermissionsStale();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    // `body.message` is the server's own plain sentence, and it is the ONLY
    // thing the user should ever be shown (P5-09). The fallback is the last
    // resort for a response that carried no message at all — never a developer
    // string like "Request Failed".
    const msg = Array.isArray(error?.message)
      ? error.message.join("; ")
      : error?.message || "Something went wrong. Please try again.";
    throw new Error(msg);
  }

  return response.json();
}
