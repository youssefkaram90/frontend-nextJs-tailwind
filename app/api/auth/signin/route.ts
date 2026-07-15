import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await fetch(`${BACKEND_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  const setCookie = response.headers.get("set-cookie");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (setCookie) {
    headers["Set-Cookie"] = setCookie;
  }
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers,
  });
}
