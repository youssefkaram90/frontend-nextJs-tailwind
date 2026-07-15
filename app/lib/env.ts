function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required envirement variable ${name}`);
  }

  return value;
}

export const env = {
  BACKEND_URL: requireEnv("BACKEND_URL"),

  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};
