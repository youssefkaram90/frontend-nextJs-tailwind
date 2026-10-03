"use client";

import React from "react";
import Header from "@/app/components/header";
import Sidebar from "@/app/components/sidebar";
import PermissionGate from "@/app/components/permission-gate";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 pl-64">
        <Header />
        <PermissionGate>{children}</PermissionGate>
      </main>
    </div>
  );
}
