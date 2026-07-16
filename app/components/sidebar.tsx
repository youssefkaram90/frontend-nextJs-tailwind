"use client";
import { useEffect, useState } from "react";
import {
  X,
  LayoutDashboardIcon,
  Warehouse,
  Truck,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";

interface navProps {
  navState: boolean;
}

function Sidebar({ navState }: navProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [dark, setDark] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboardIcon },
    { name: "Deliveries", path: "/deliveries", icon: Truck },
    { name: "Stock", path: "/stock", icon: Warehouse },
  ];

  useEffect(() => {
    setNavOpen(true);
  }, [navState]);
  return (
    <nav
      className={`
        fixed bg-white w-64 h-screen shadow 
        ${navOpen ? "translate-x-0" : "-translate-x-64"}
       lg:translate-x-0  `}
    >
      <div className="p-4 flex justify-between border-b">
        <div className="text-xl font-bold">Logo</div>
        <button
          className="lg:hidden"
          onClick={() => {
            setNavOpen(false);
          }}
        >
          <X />
        </button>
      </div>

      <div className="p-4 space-y-2 ">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              href={item.path}
              key={item.name}
              className="flex p-2 space-x-2 hover:bg-gray-100"
            >
              <Icon className="text-lg" />
              <div className="text-lg">{item.name}</div>
            </Link>
          );
        })}

        <div className="flex text-2xl justify-center">
          {dark ? (
            <button
              onClick={() => setDark(false)}
              className="p-2 bg-white rounded-full"
            >
              <Sun className="text-black" />
            </button>
          ) : (
            <button
              onClick={() => setDark(true)}
              className="p-2 bg-black rounded-full"
            >
              <Moon className="text-white" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
