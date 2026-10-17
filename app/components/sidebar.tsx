"use client";
import {  useEffect, useSyncExternalStore } from "react";
import {
  LayoutDashboardIcon,
  Warehouse,
  Truck,
  PackageCheck,
  Sprout,
  Users,
  Moon,
  Sun,
  ArrowRightLeft,
  Flower2,
  Droplets,
  Wheat,
  CalendarRange,
  Cog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import type { PermissionName } from "@/app/lib/permissions";

function getThemeSnapshot(): boolean {
  const stored = localStorage.getItem("theme");

  if (stored === "dark") return true;
  if (stored === "light") return false;

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getThemeServerSnapshot(): boolean {
  return false;
}

function subscribeToTheme(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  window.addEventListener("storage", callback);
  media.addEventListener("change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}

function Sidebar() {
  const { can, isAdmin } = usePermissions();

  const dark = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleDarkMode = () => {
    localStorage.setItem("theme", dark ? "light" : "dark");
    window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
  };

  // `permission: null` = always visible. Items without a permission are hidden
  // for users who cannot view that module (ADMIN sees everything).
  const navItems: {
    name: string;
    path: string;
    icon: LucideIcon;
    permission: PermissionName | null;
    adminOnly?: boolean;
  }[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboardIcon,
      permission: null,
    },
    {
      name: "Deliveries",
      path: "/deliveries",
      icon: PackageCheck,
      permission: "deliveries.view",
    },
    {
      name: "Sowing",
      path: "/sowing",
      icon: Sprout,
      permission: "sowing.view",
    },
    {
      name: "Transport",
      path: "/sowing/tray-transport",
      icon: ArrowRightLeft,
      permission: "sowing.view",
    },
    {
      name: "Plant Stock",
      path: "/plant-stock",
      icon: Flower2,
      permission: "plant-stock.view",
    },
    {
      name: "Crop Care",
      path: "/crop-care",
      icon: Droplets,
      permission: "crop-care.view",
    },
    // Phytosanitary and Agri-inputs are NOT nav items any more (user, 2026-10-11):
    // the catalogue, the program, compliance and the product stock are reached as
    // links FROM the Crop Care page, so a treatment and the products it uses are one
    // place. Their addresses and permission gates are unchanged — only the entry
    // point moved. The Crop Care item itself needs `crop-care.view`; the
    // phytosanitary links inside it appear per `phytosanitary.view`.
    {
      name: "Harvest",
      path: "/harvest",
      icon: Wheat,
      permission: "harvest.view",
    },
    {
      name: "Trucks & Shipments",
      path: "/trucks",
      icon: Truck,
      permission: "trucks.view",
    },
    {
      name: "Stock",
      path: "/stock",
      icon: Warehouse,
      permission: "stock.view",
    },
    {
      name: "Users",
      path: "/users",
      icon: Users,
      permission: "users.view",
    },
    {
      name: "Season",
      path: "/seasons",
      icon: CalendarRange,
      permission: null,
      adminOnly: true,
    },
    {
      // The figures the farm can change without a developer (SOW-11). ADMIN-only
      // on the server, and the page says so itself, exactly like Season above.
      name: "Settings",
      path: "/settings",
      icon: Cog,
      permission: null,
      adminOnly: true,
    },
  ];

  return (
    <nav
      className={`
    fixed w-64 h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 shadow-2xl z-50
    border-r border-white/20 transition-transform duration-300
  `}
    >
      <div className="p-4 flex justify-between border-b border-gray-200">
        <div className="text-xl font-bold text-gray-700 dark:text-gray-200">
          Logo
        </div>
      </div>

      <div className="p-4 space-y-2 ">
        {navItems
          .filter(
            (item) => can(item.permission) && (!item.adminOnly || isAdmin),
          )
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.path}
                key={item.name}
                className="flex items-center gap-3 rounded-lg px-3 py-2 
              text-gray-700 dark:text-gray-100 hover:bg-green-50 hover:text-green-700 
              bg-gray-200 dark:bg-gray-700
              transition duration-200"
              >
                <Icon className="text-lg" />
                <div className="text-lg">{item.name}</div>
              </Link>
            );
          })}

        <div className="flex text-2xl justify-start">
          <button
            onClick={toggleDarkMode}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"
            aria-label={dark ? "switch to light mode" : "switch to dark mode"}
            aria-pressed={dark}
            suppressHydrationWarning
          >
            { 
              dark ? (
                <Sun className="text-gray-100" />
              ) : (
                <Moon className="text-gray-900" />
              )}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
