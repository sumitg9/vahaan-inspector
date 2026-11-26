"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Pages that should NOT display the authenticated sidebar or header:
  // - Login and authentication desk (/login)
  // - Public cryptographic QR verification portal (/verify-report/*)
  const isAuthOrPublic =
    pathname === "/login" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/verify-report");

  if (isAuthOrPublic) {
    return <div className="min-h-screen w-full bg-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-canvas text-slate-900 antialiased w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
