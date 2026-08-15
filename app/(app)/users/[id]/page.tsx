"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getUser,
  updateUserRole,
  getCurrentUser,
} from "@/app/lib/services/users";
import {
  getAllPermissions,
  getUserPermissions,
  setUserPermissions,
} from "@/app/lib/services/permissions";
import type { User, Permission } from "@/app/lib/types/user";
import { UserRole } from "@/app/lib/types/user";
import {
  ArrowLeft,
  Shield,
  ShieldOff,
  Save,
  Eye,
  PlusCircle,
  Edit,
  Trash2,
  Truck,
  Sprout,
  Warehouse,
  Users,
  KeyRound,
} from "lucide-react";

// Map module names to display labels and icons
const MODULE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  deliveries: {
    label: "Deliveries",
    icon: <Truck className="h-5 w-5" />,
    color: "bg-amber-500",
  },
  sowing: {
    label: "Sowing",
    icon: <Sprout className="h-5 w-5" />,
    color: "bg-green-500",
  },
  stock: {
    label: "Stock",
    icon: <Warehouse className="h-5 w-5" />,
    color: "bg-indigo-500",
  },
  users: {
    label: "Users",
    icon: <Users className="h-5 w-5" />,
    color: "bg-purple-500",
  },
  permissions: {
    label: "Permissions",
    icon: <KeyRound className="h-5 w-5" />,
    color: "bg-rose-500",
  },
};

// Actions that can be toggled
const ACTIONS = [
  { key: "view", label: "View", icon: <Eye className="h-4 w-4" /> },
  { key: "create", label: "Create", icon: <PlusCircle className="h-4 w-4" /> },
  { key: "edit", label: "Edit", icon: <Edit className="h-4 w-4" /> },
  { key: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" /> },
];

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userPermissionIds, setUserPermissionIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isOwnProfile = currentUser?.id === params.id;

  // Build a structured map: { module: { action: Permission } }
  const permissionMap = useMemo(() => {
    const map: Record<string, Record<string, Permission>> = {};
    for (const perm of allPermissions) {
      const parts = perm.name.split(".");
      const module = parts[0] || "other";
      const action = parts[1] || perm.name;
      if (!map[module]) map[module] = {};
      map[module][action] = perm;
    }
    return map;
  }, [allPermissions]);

  // Get sorted list of module names to display
  const modules = useMemo(() => {
    return Object.keys(permissionMap).sort();
  }, [permissionMap]);

  const totalCount = allPermissions.length;
  const selectedCount = userPermissionIds.size;

  useEffect(() => {
    async function load() {
      try {
        const [userData, currentUserData, permissions, userPerms] =
          await Promise.all([
            getUser(params.id),
            getCurrentUser(),
            getAllPermissions(),
            getUserPermissions(params.id),
          ]);
        setUser(userData);
        setCurrentUser(currentUserData);
        setAllPermissions(permissions);
        setUserPermissionIds(new Set(userPerms.map((p) => p.id)));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load user data",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleRoleChange(newRole: string) {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserRole(user.id, newRole);
      setUser({ ...user, role: newRole as typeof user.role });
      setSuccess("Role updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  function togglePermission(permissionId: string) {
    setUserPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  }

  function toggleAllInModule(mod: string, enable: boolean) {
    const modulePerms = permissionMap[mod];
    if (!modulePerms) return;
    setUserPermissionIds((prev) => {
      const next = new Set(prev);
      for (const perm of Object.values(modulePerms)) {
        if (enable) {
          next.add(perm.id);
        } else {
          next.delete(perm.id);
        }
      }
      return next;
    });
  }

  function isModuleFullyEnabled(mod: string) {
    const modulePerms = permissionMap[mod];
    if (!modulePerms) return false;
    return Object.values(modulePerms).every((p) => userPermissionIds.has(p.id));
  }

  function isModulePartiallyEnabled(mod: string) {
    const modulePerms = permissionMap[mod];
    if (!modulePerms) return false;
    const selected = Object.values(modulePerms).filter((p) =>
      userPermissionIds.has(p.id),
    );
    return (
      selected.length > 0 && selected.length < Object.keys(modulePerms).length
    );
  }

  async function handleSavePermissions() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setUserPermissions(params.id, Array.from(userPermissionIds));
      setSuccess("Permissions saved successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save permissions",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="p-4">
        <button
          onClick={() => router.push("/users")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/users")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </button>

      {/* Feedback Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* User Info Card */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Information
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </label>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Name
              </label>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {user.lastName || "—"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </label>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {new Date(user.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Role
            </label>
            {isAdmin && !isOwnProfile ? (
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={saving}
                className="w-full sm:w-48 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="USER">User</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Permissions Card */}
      {isAdmin && (
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Module Permissions
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedCount} of {totalCount} permissions enabled
                </p>
              </div>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                  disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 text-sm"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {allPermissions.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No permissions found. Permissions must be configured in the
              database.
            </div>
          ) : (
            <div className="px-6 py-4 space-y-4">
              {modules.map((mod) => {
                const modulePerms = permissionMap[mod];
                if (!modulePerms) return null;
                const config = MODULE_CONFIG[mod] || {
                  label: mod.charAt(0).toUpperCase() + mod.slice(1),
                  icon: null,
                  color: "bg-gray-500",
                };
                const actions = Object.keys(modulePerms).sort();
                const fullyEnabled = isModuleFullyEnabled(mod);
                const partiallyEnabled = isModulePartiallyEnabled(mod);

                return (
                  <div
                    key={mod}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Module Header */}
                    <div
                      className={`flex items-center justify-between px-4 py-3 ${
                        fullyEnabled
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : "bg-gray-50 dark:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 ${config.color} rounded-lg flex items-center justify-center text-white`}
                        >
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {config.label}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {
                              Object.values(modulePerms).filter((p) =>
                                userPermissionIds.has(p.id),
                              ).length
                            }{" "}
                            of {actions.length} enabled
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleAllInModule(mod, true)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-l-lg border transition ${
                            fullyEnabled
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-indigo-50"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => toggleAllInModule(mod, false)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-r-lg border transition ${
                            !partiallyEnabled && !fullyEnabled
                              ? "bg-gray-600 text-white border-gray-600"
                              : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          None
                        </button>
                      </div>
                    </div>

                    {/* Action Toggle Switches */}
                    <div className="px-4 py-3 bg-white dark:bg-gray-800">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {actions.map((action) => {
                          const perm = modulePerms[action];
                          if (!perm) return null;
                          const isEnabled = userPermissionIds.has(perm.id);
                          const actionConfig = ACTIONS.find(
                            (a) => a.key === action,
                          );

                          return (
                            <label
                              key={perm.id}
                              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                                bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600
                                hover:border-indigo-300 dark:hover:border-indigo-500 transition select-none"
                            >
                              <div className="flex items-center gap-2">
                                {actionConfig?.icon && (
                                  <span
                                    className={`${isEnabled ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}`}
                                  >
                                    {actionConfig.icon}
                                  </span>
                                )}
                                <span
                                  className={`text-sm font-medium ${
                                    isEnabled
                                      ? "text-gray-900 dark:text-white"
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  {actionConfig?.label || action}
                                </span>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isEnabled}
                                onClick={() => togglePermission(perm.id)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                                  ${isEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
                                    transition duration-200 ease-in-out
                                    ${isEnabled ? "translate-x-4" : "translate-x-0"}`}
                                />
                              </button>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
