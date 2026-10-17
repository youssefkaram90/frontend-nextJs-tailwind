"use client";

import { Search } from "lucide-react";

type Props = {
  /** The text to show. The PAGE owns it — see the note below. */
  value: string;
  /** Called on every keystroke. The page debounces. */
  onChange: (value: string) => void;
  placeholder?: string;
};

/**
 * The app's search box.
 *
 * It used to own the query internally (`useSearch()` called INSIDE the
 * component), which made it impossible to use: a page could render it but had no
 * way to read what the user typed, so it could not fetch anything with it — and
 * no page ever adopted it (STOCK-05).
 *
 * It is purely presentational now: the page keeps the text (via `useSearch()`)
 * and this draws the box. That is the split that makes it reusable — the LOOK is
 * shared here, the debounce stays on the page where the value is actually used.
 */
export function SearchBar({ value, onChange, placeholder = "Search…" }: Props) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm"
      />
    </div>
  );
}
