"use client";

import { useRouter } from "next/navigation";
import { useUsers } from "@/app/lib/hooks/use-users";
import { Users, Plus, Shield, ShieldOff, Search } from "lucide-react";
import { TableSkeleton } from "@/app/components/skeleton";
import { useSearch } from "@/app/lib/use-search";

export default function UsersPage() {
  const router = useRouter();
  const { query, setQuery, debouncedQuery } = useSearch();
  const {
    data: users = [],
    isPending,
    error,
  } = useUsers(debouncedQuery || undefined);

  if (isPending) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage user accounts
          </p>
        </div>
        <button
          onClick={() => router.push("/signup")}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 text-sm"
        >
          <Plus className="h-4 w-4" />
          New User
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name, last name, role…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Users
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                  <th className="px-6 py-3 text-left font-medium">Name</th>
                  <th className="px-6 py-3 text-left font-medium">Last Name</th>
                  <th className="px-6 py-3 text-left font-medium">Role</th>
                  <th className="px-6 py-3 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/users/${user.id}`)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {user.lastName || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "MANAGER"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {user.role === "ADMIN" || user.role === "MANAGER" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <ShieldOff className="h-3 w-3" />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
