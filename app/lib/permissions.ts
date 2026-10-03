/**
 * Permission names — the single source of truth for the client.
 *
 * MUST mirror `Backend/prisma/seed.ts`. Without this, a typo like
 * `can("delivries.edit")` type-checks as a plain string and silently hides a
 * button forever. With it, a wrong name is a compile error.
 *
 * Only the actions that actually exist on a module are listed (e.g. `stock` is
 * read-only, `harvest` has no edit route).
 */
export const PERMISSIONS = {
  deliveries: ["view", "create", "edit", "delete"],
  sowing: ["view", "create", "edit", "delete"],
  // Tray transport is part of sowing — its screens ride `sowing.*` (TRAY-05).
  stock: ["view"],
  "plant-stock": ["view", "create", "edit"],
  tunnels: ["view", "create", "edit", "delete"],
  sectors: ["view", "create", "edit", "delete"],
  "crop-care": ["view", "create", "edit", "delete"],
  phytosanitary: ["view", "create", "edit", "delete"],
  harvest: ["view", "create", "delete"],
  shipments: ["view", "create", "edit", "delete"],
  trucks: ["view", "create", "edit", "delete"],
  users: ["view"],
  permissions: ["view"],
} as const;

export type PermissionAction = "view" | "create" | "edit" | "delete";

/** Result shape of `useCaps()` — one flag per action. */
export type Caps = Record<PermissionAction, boolean>;

export type PermissionModule = keyof typeof PERMISSIONS;

type ActionsOf<M extends PermissionModule> = (typeof PERMISSIONS)[M][number];

/**
 * Precise union of valid names, e.g. "deliveries.view" … "stock.view".
 * Note "stock.create" is intentionally NOT part of it.
 */
export type PermissionName = {
  [M in PermissionModule]: `${M}.${ActionsOf<M>}`;
}[PermissionModule];

/** True when the module actually declares that action. */
export function moduleHasAction(
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  return (PERMISSIONS[module] as readonly string[]).includes(action);
}
