"use client";
import { useState, useEffect } from "react";
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
  FlaskConical,
  Beaker,
  CalendarRange,
} from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import type { PermissionName } from "@/app/lib/permissions";

function Sidebar() {
  const { can, isAdmin } = usePermissions();
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") setDark(true);
    else if (stored === "light") setDark(false);
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleDarkMode = () => setDark((prev) => !prev);

  // `permission: null` = always visible. Items without a permission are hidden
  // for users who cannot view that module (ADMIN sees everything).
  const navItems: {
    name: string;
    path: string;
    icon: React.ComponentType<any>;
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
    {
      name: "Phytosanitary",
      path: "/phytosanitary",
      icon: FlaskConical,
      permission: "phytosanitary.view",
    },
    {
      // Which products this season may use, and what is left of each. Separate
      // from Phytosanitary, which is the catalogue and the program: this screen
      // is the per-season list and its stock.
      name: "Agri-inputs",
      path: "/agri-inputs",
      icon: Beaker,
      permission: "phytosanitary.view",
    },
    {
      name: "Harvest",
      path: "/harvest",
      icon: Wheat,
      permission: "harvest.view",
    },
    {
      name: "Trucks",
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
            aria-label={
              mounted
                ? dark
                  ? "switch to light mode"
                  : "switch to dark mode"
                : "toggle theme"
            }
            aria-pressed={mounted ? dark : undefined}
            suppressHydrationWarning
          >
            {mounted ? (
              dark ? (
                <Sun className="text-gray-100" />
              ) : (
                <Moon className="text-gray-900" />
              )
            ) : (
              <Sun className="text-gray-100" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
