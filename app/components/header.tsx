"use client";

import { useRouter } from "next/navigation";
import { signout } from "@/app/lib/auth";
import { LogOut, AlertTriangle, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/app/lib/services/users";
import { useActiveSeason, useSeasons } from "../lib/hooks/use-seasons";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import type { User } from "@/app/lib/types/user";

/**
 * The season an administrator is browsing, when it is not the open one.
 *
 * A cookie rather than component state, because the SERVER needs it: every list
 * is scoped by the season the server picks, so the choice has to travel with the
 * request. It is honoured on GETs only, and for administrators only — see
 * `SeasonViewInterceptor` on the backend — and it expires by itself after a day.
 */
const SEASON_COOKIE = "season";

function readSeasonCookie(): string {
  if (typeof document === "undefined") return "";
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${SEASON_COOKIE}=`));
  return row ? decodeURIComponent(row.slice(SEASON_COOKIE.length + 1)) : "";
}

function writeSeasonCookie(id: string) {
  document.cookie = id
    ? `${SEASON_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=86400; samesite=lax`
    : `${SEASON_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export default function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const { data: season } = useActiveSeason();
  const { isAdmin } = usePermissions();
  const { data: seasons = [] } = useSeasons(isAdmin);
  const [viewing, setViewing] = useState("");

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  // The cookie is the source of truth, but it is not reactive, so it is copied
  // into state once on mount.
  useEffect(() => {
    setViewing(readSeasonCookie());
  }, []);

  /**
   * Switching only takes effect on the NEXT request, because it is the server
   * that picks the season. So every cached list has to be thrown away, or the
   * screens would keep showing the season that was there a moment ago.
   */
  function onSwitchSeason(id: string) {
    writeSeasonCookie(id);
    setViewing(id);
    queryClient.invalidateQueries();
    router.refresh();
  }

  async function handleSignout() {
    try {
      await signout();
    } catch {
      // Even if the request fails, redirect to signin
    }
    router.push("/signin");
  }

  const displayName = user
    ? [user.name, user.lastName].filter(Boolean).join(" ")
    : "User";

  const avatarLetter = user
    ? (user.lastName
        ? user.name.charAt(0) + user.lastName.charAt(0)
        : user.name.charAt(0)
      ).toUpperCase()
    : "U";

  return (
    <header className="flex items-center justify-between rounded-2xl bg-gray-100 dark:bg-gray-800 p-4 shadow-2xl">
      <div className="flex flex-1 items-center gap-2">
        {season ? (
          isAdmin ? (
            <label
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-white ${
                viewing ? "bg-amber-500" : "bg-green-600"
              }`}
              title="Which season the screens show. Only an administrator can change this — a new record always goes to the open season."
            >
              <CalendarDays className="h-4 w-4" />
              <span className="sr-only">Season shown</span>
              <select
                value={viewing}
                onChange={(e) => onSwitchSeason(e.target.value)}
                className="cursor-pointer bg-transparent text-sm font-semibold text-white outline-none"
              >
                <option value="" className="text-gray-900">
                  Season {season.code} (open)
                </option>
                {seasons
                  .filter((s) => s.id !== season.id)
                  .map((s) => (
                    <option key={s.id} value={s.id} className="text-gray-900">
                      {s.code} — {s.status === "CLOSED" ? "closed" : "not open"}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <span
              className="flex items-center gap-2 rounded-xl bg-green-600 px-3 py-1.5 text-sm font-semibold text-white"
              title="Every new record is added to this season"
            >
              <CalendarDays className="h-4 w-4" />
              Season {season.code}
            </span>
          )
        ) : (
          <span
            className="flex items-center gap-2 rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            title="No season is open - new records cannot be added yet"
          >
            <AlertTriangle className="h-4 w-4" />
            No season open
          </span>
        )}

        {/* A browsed past season is read-only, and it must never be mistaken for
            the real one — the amber colour and this line are the reminder. */}
        {isAdmin && viewing && (
          <span className="rounded-xl bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Read-only — new records still go to season {season?.code}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-100">
              {displayName}
            </p>
            <p className="text-xs text-green-400 dark:text-green-700">
              {user?.role ?? "Admin"}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-sm font-medium text-white">
            {avatarLetter}
          </div>
        </div>

        <button
          onClick={handleSignout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition duration-200"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
