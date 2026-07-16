"use client"

import React,{useState} from "react";
import Header from "@/app/components/header";
import Sidebar from "@/app/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
 
  const [navState,setNavState] = useState<boolean>(false)
 
  return (
    <div className="flex bg-gray-100 h-screen">
      <Sidebar navState={navState} />
      <main className="flex-1">
        <Header setNavState={setNavState} navState={navState}/>
        {children}
      </main>
    </div>
  );
}
