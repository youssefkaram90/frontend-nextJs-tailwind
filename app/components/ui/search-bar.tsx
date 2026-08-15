"use client";

import { useSearch } from "@/app/lib/use-search";
import { Search } from "lucide-react";

type Props = {
  placeholder?: string;
};

export function SearchBar({ placeholder = "Search..." }: Props) {
  const { query, setQuery } = useSearch(400);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}
