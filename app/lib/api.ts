const API_URL = process.env.NEXT_PUBLIC_API_URL ||"";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", { method: "POST" });
      return response.ok;
    } catch {
      return false;
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

  const url = endpoint.startsWith("/api/") ? endpoint : `${API_URL}${endpoint}`
  let response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401 && !endpoint.startsWith("/api/auth/")) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Request Failed");
  }

  return response.json();
}