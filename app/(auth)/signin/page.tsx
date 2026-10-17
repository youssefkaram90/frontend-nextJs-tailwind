"use client";

import { signin } from "@/app/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Where to send the user after a successful sign-in.
 *
 * Two callers already put the destination in the address bar: `api.ts` when a
 * session expires mid-screen, and `proxy.ts` when there is no session at all.
 * Nobody read it, so signing back in always dumped the user on the dashboard
 * (AUTH-17).
 *
 * Read from `window.location` on demand rather than with `useSearchParams`:
 * that hook opts a page out of static rendering unless it is wrapped in a
 * Suspense boundary, which is a lot of ceremony for one string.
 *
 * Only a same-site path is accepted. `//evil.example` and `https://evil.example`
 * are absolute URLs wearing a path's clothing, and following one would turn the
 * sign-in page into somebody else's redirect — the leading `//` and `\/` forms
 * are refused for exactly that reason.
 */
function safeNextPath(): string | null {
  const next = new URLSearchParams(window.location.search).get("next");

  if (!next || !next.startsWith("/") || /^\/[\\/]/.test(next)) return null;

  return next;
}

export default function Signin() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signin({
        name,
        password,
      });

      // `replace`, not `push`: going back must not land on the sign-in page of a
      // session that is already open.
      router.replace(safeNextPath() ?? "/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid Credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-900 via-slate-900 
    to-gray-900 flex items-center justify-center px-4 py-8 "
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Name
            </label>
            <input
              required
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                       transition duration-200"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Password
            </label>
            <input
              required
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                       transition duration-200"
            />
          </div>
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold 
          rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
