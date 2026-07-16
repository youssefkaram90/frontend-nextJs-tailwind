"use client";

import React, { useState } from "react";
import Header from "@/app/components/header";
import Sidebar from "@/app/components/sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex bg-gray-100 dark:bg-neutral-950 h-screen">
      <Sidebar navOpen={navOpen} onClose={() => setNavOpen(false)} />

      <main className="flex-1 lg:pl-64">
        <Header onMenuClick={() => setNavOpen((open) => !open)} />
        {children}
      </main>
    </div>
  );
}