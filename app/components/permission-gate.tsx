"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import type { PermissionName } from "@/app/lib/permissions";

/**
 * Route → required permission. First (longest / most specific) match wins,
 * so keep more specific prefixes above their parents.
 * `null` = no permission needed.
 */
export const ROUTE_PERMISSIONS: {
  prefix: string;
  permission: PermissionName | null;
}[] = [
  { prefix: "/dashboard", permission: null },
  { prefix: "/sowing/tray-transport", permission: "sowing.view" },
  { prefix: "/sowing", permission: "sowing.view" },
  { prefix: "/deliveries", permission: "deliveries.view" },
  { prefix: "/plant-stock", permission: "plant-stock.view" },
  { prefix: "/crop-care", permission: "crop-care.view" },
  { prefix: "/phytosanitary", permission: "phytosanitary.view" },
  { prefix: "/harvest", permission: "harvest.view" },
  // More specific first: shipments live inside the trucks section but are
  // gated separately, so /trucks/shipments must match before /trucks.
  { prefix: "/trucks/shipments", permission: "shipments.view" },
  { prefix: "/trucks", permission: "trucks.view" },
  { prefix: "/stock", permission: "stock.view" },
  { prefix: "/users", permission: "users.view" },
];

export function requiredPermissionFor(pathname: string): PermissionName | null {
  const match = ROUTE_PERMISSIONS.find(
    (route) =>
      pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
  );
  return match?.permission ?? null;
}

/**
 * Blocks a page the current user cannot view — so a typed URL or a stale
 * bookmark shows a clear message instead of a screen full of 403s.
 */
export default function PermissionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { can, isLoading } = usePermissions();

  // Only the first load waits; the user is cached afterwards.
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  const required = requiredPermissionFor(pathname);
  if (required && !can(required)) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
        <ShieldAlert className="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          No access
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          You don&apos;t have permission to open this section. Ask an
          administrator to grant it to you.
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
