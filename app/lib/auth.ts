import { api } from "./api";

export interface SigninDto {
  name: string;
  password: string;
}

/**
 * Sign in.
 *
 * The NAME is trimmed and the password is NOT, which is the difference between
 * a slip and a secret: a name is typed from memory and a stray leading or
 * trailing space is an accident, while a password's spaces are deliberately
 * part of it. The phone app has always done exactly this (`signinSchema` has
 * `.trim()` on the name and nothing on the password), so the two clients now
 * send the same thing — before this, "  John" signed you in on the phone and
 * failed on the web with "Incorrect name or password."
 *
 * Trimming is NOT normalisation: the case is left exactly as typed, because the
 * name is the credential and the account is stored as it was entered (AUTH-12).
 * Only surrounding whitespace is removed.
 */
export async function signin(signinDto: SigninDto) {
  return api("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({
      ...signinDto,
      name: signinDto.name.trim(),
    }),
  });
}

export async function refreshToken() {
  return api<{ accessToken: string; refreshToken: string }>(
    "/api/auth/refresh",
    { method: "POST" },
  );
}

export async function signout() {
  return api("/api/auth/signout", { method: "POST" });
}

export async function signoutAll() {
  return api("/api/auth/signout-all", { method: "POST" });
}
