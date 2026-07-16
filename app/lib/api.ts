const API_URL = process.env.NEXT_PUBLIC_API_URL ||"";

export async function api<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {

  const url = endpoint.startsWith("/api/") ? endpoint : `${API_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(error?.message || "Request Faild");
  }

  return response.json();
}
