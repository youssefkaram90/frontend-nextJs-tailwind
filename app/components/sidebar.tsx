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

interface NavbarProps {
  navOpen: boolean;
  onClose:()=>void;
}

function Sidebar({ navOpen ,onClose}: NavbarProps) {
  const [dark, setDark] = useState(false);

  const toggleDarkMode = ()=>{
    setDark((current)=>{
      const next = !current;
      document.documentElement.classList.toggle("dark",next);
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
        fixed bg-white w-64 h-screen shadow z-50 transition-transform duration-300
        ${navOpen ? "translate-x-0" : "-translate-x-64"}
       lg:translate-x-0  `}
    >
      <div className="p-4 flex justify-between border-b">
        <div className="text-xl font-bold">Logo</div>
        <button
          className="lg:hidden"
          onClick={onClose}
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
          <button onClick={toggleDarkMode}
          className="p-2 bg-whit dark:bg-black rounded-full">
            {
              dark ? (
                <Sun className="text-black dark:text-white"/>
              ):(
                <Moon className="text-black"/>
              )
            }

          </button>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
