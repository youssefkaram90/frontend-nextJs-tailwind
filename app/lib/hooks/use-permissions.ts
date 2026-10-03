"use client";

import { useCallback, useMemo } from "react";
import { useCurrentUser } from "./use-users";
import { UserRole } from "@/app/lib/types/user";
import {
  moduleHasAction,
  type Caps,
  type PermissionAction,
  type PermissionModule,
  type PermissionName,
} from "@/app/lib/permissions";

/**
 * Permission-aware UI helpers — mirrors the backend rules.
 *
 * - ADMIN bypasses every check (same as PermissionsGuard).
 * - Everyone else is limited to their permission names from GET /users/me.
 *
 * Use `can("sowing.create")` to hide UI the server would reject with 403.
 */
export function usePermissions() {
  const { data: user, isLoading, isError } = useCurrentUser();

  const isAdmin = user?.role === UserRole.ADMIN;

  const permissions = useMemo(
    () => new Set(user?.permissions ?? []),
    [user?.permissions],
  );

  const can = useCallback(
    (permission?: PermissionName | null) => {
      // No permission required (e.g. Dashboard) → always allowed.
      if (!permission) return true;
      if (isAdmin) return true;
      return permissions.has(permission);
    },
    [isAdmin, permissions],
  );

  return { user, isAdmin, can, permissions, isLoading, isError };
}

/**
 * Per-module capability flags for a page, e.g.
 *
 *   const caps = useCaps("deliveries");
 *   {caps.create && <NewButton />}
 *
 * Actions the module doesn't define (e.g. `stock.create`) are always false, so
 * a typo'd button can never accidentally show.
 */
export function useCaps<M extends PermissionModule>(module: M): Caps {
  const { can } = usePermissions();

  const cap = useCallback(
    (action: PermissionAction) =>
      moduleHasAction(module, action)
        ? can(`${module}.${action}` as PermissionName)
        : false,
    [can, module],
  );

  return {
    view: cap("view"),
    create: cap("create"),
    edit: cap("edit"),
    delete: cap("delete"),
  };
}
