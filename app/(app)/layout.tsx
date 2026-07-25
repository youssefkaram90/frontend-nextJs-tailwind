import React from "react";
import AppShell from "@/app/components/app-shell";
import { ToastProvider } from "@/app/lib/toast-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}
