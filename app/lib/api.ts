import { error } from "console";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function api<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Contrnt-type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(error?.message || "Request Faild");
  }

  return response.json();
}
