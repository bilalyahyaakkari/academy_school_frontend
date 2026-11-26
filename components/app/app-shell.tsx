"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "academy:sidebar-collapsed";

// ---- localStorage-backed "collapsed" flag as an external store ----
// useSyncExternalStore renders the server snapshot (expanded) during
// hydration, then re-renders with the stored value — no hydration mismatch and
// no setState-in-effect.

const listeners = new Set<() => void>();
/** Fallback for when localStorage is unavailable (private mode, etc.). */
let memoryCollapsed = false;

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return memoryCollapsed;
  }
}

function writeCollapsed(value: boolean) {
  memoryCollapsed = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore — the in-memory notify below still updates this tab
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other tabs in sync too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerSnapshot = () => false;

const SidebarCollapsedContext = createContext(false);

/**
 * Whether the desktop sidebar is collapsed (w-16) rather than expanded (w-64).
 * Use it to offset fixed-position UI, e.g. `collapsed ? "md:start-16" : "md:start-64"`.
 */
export function useSidebarCollapsed(): boolean {
  return useContext(SidebarCollapsedContext);
}

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
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, getServerSnapshot);

  const toggle = useCallback(() => writeCollapsed(!readCollapsed()), []);

  return (
    <SidebarCollapsedContext.Provider value={collapsed}>
      <Sidebar
        academyName={academyName}
        collapsed={collapsed}
        onToggle={toggle}
      />
      <div
        className={cn(
          // min-w-0: without it a wide child (a scrolling card row, a table)
          // stretches this flex item and the whole page scrolls sideways.
          "relative flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "md:ps-16" : "md:ps-64",
        )}
      >
        <TopBar userName={userName} academyName={academyName} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </SidebarCollapsedContext.Provider>
  );
}
