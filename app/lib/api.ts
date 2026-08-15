const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim();
export const AUTH_EXPIRED_EVENT = "auth-expired";

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

export async function api<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("/api/") ? endpoint : `${API_URL}${endpoint}`;
  let response = await fetch(url, {
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
      response = await fetch(url, {
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

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    // NestJS validation errors have message as array
    const msg = Array.isArray(error?.message)
      ? error.message.join("; ")
      : error?.message || "Request Failed";
    throw new Error(msg);
  }

  return response.json();
}
