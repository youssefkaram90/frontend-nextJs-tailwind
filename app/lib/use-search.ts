"use client";

import { useState, useEffect, useRef } from "react";

/**
 * A hook that debounces a search query and provides the debounced value.
 * @param delay - debounce delay in ms (default: 300)
 * @returns [query, debouncedQuery, setQuery] — use `debouncedQuery` to trigger API calls
 */
export function useSearch(delay = 300) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, delay]);

  return { query, setQuery, debouncedQuery } as const;
}
