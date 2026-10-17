"use client";

import { useState, useEffect, useRef } from "react";

/**
 * A hook that debounces a search query and provides the debounced value.
 *
 * The delay lives here, in ONE place, so every search box in the app feels the
 * same. It is deliberately SHORT (300 ms): the debounce only spaces requests
 * out, and it is `placeholderData: keepPreviousData` on the list queries that
 * stops a search from blanking the page. A longer delay did not help — it made
 * the list feel sluggish and, worse, fired during a natural pause between words.
 *
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
