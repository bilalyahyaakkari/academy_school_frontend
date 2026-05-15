"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "academy:sidebar-collapsed";

/**
 * Client wrapper that owns the sidebar collapsed state. The state is
 * persisted to localStorage so it survives full page reloads.
 *
 * AppLayout (server component) renders this and passes the children through.
 */
export function AppShell({
  academyName,
  userName,
  children,
}: {
  academyName: string;
  userName: string;
  children: React.ReactNode;
}) {
  // Initialise mounted=false to avoid a flash of the default (expanded) state
  // before localStorage is read. Once mounted, we apply the persisted value.
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      // localStorage may be unavailable (private mode, etc.)
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed, mounted]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return (
    <>
      <Sidebar
        academyName={academyName}
        collapsed={collapsed}
        onToggle={toggle}
      />
      <div
        className={cn(
          "relative flex flex-1 flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "md:ps-16" : "md:ps-64",
        )}
      >
        <TopBar userName={userName} academyName={academyName} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </>
  );
}
