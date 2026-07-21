"use client";

import React, { useState } from "react";
import Header from "@/app/components/header";
import Sidebar from "@/app/components/sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {


  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 lg:pl-64">
        <Header />
        {children}
      </main>
    </div>
  );
}