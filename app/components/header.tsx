import { Menu } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface HeaderProps {
  onMenuClick:()=>void;
}

export default function Header({ onMenuClick}: HeaderProps) {
  return (
    <header className="flex justify-between bg-white p-4">
      <button onClick={onMenuClick}>
        <Menu className="font-bold lg:hidden" size={24} />
      </button>
      <div className="text-2xl font-bold ">dashboard</div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700"> Youssef Karam </p>
          <p className="text-xs text-gray-400">Admin</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
          YD
        </div>
      </div>
    </header>
  );
}
