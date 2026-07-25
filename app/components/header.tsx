"use client";

import { useRouter } from "next/navigation";
import { signout } from "@/app/lib/auth";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/app/lib/services/users";
import type { User } from "@/app/lib/types/user";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

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
      <div className="flex-1" />

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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
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
