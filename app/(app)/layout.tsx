import React from "react";
import AppShell from "@/app/components/app-shell";
import { ToastProvider } from "@/app/lib/toast-context";
import { QueryProvider } from "@/app/lib/hooks/query-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </QueryProvider>
  );
}
