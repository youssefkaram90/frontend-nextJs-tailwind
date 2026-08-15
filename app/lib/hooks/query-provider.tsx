"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { AUTH_EXPIRED_EVENT, AuthExpiredError } from "@/app/lib/api";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (error instanceof AuthExpiredError) return false;
              return failureCount < 2;
            },
            staleTime: 30_000, // 30s before data is considered stale
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    const clearSessionQueries = () => queryClient.clear();

    window.addEventListener(AUTH_EXPIRED_EVENT, clearSessionQueries);
    return () =>
      window.removeEventListener(AUTH_EXPIRED_EVENT, clearSessionQueries);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
