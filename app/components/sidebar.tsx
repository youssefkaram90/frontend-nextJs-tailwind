"use client";
import { useState } from "react";
import {
  X,
  LayoutDashboardIcon,
  Warehouse,
  Truck,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";

function Sidebar() {
  const [dark, setDark] = useState(false);

  const toggleDarkMode = () => {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboardIcon },
    { name: "Deliveries", path: "/deliveries", icon: Truck },
    { name: "Stock", path: "/stock", icon: Warehouse },
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
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              href={item.path}
              key={item.name}
              className="flex items-center gap-3 rounded-lg px-3 py-2 
              text-gray-700 dark:text-gray-100 hover:bg-indigo-50 hover:text-indigo-700 
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
          >
            {dark ? (
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
