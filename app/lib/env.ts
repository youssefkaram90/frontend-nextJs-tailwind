export const env = {
  // Used by BFF route handlers (server-side only — safe)
  BACKEND_URL: process.env.BACKEND_URL!,

  // Keep for backward compat if needed
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};