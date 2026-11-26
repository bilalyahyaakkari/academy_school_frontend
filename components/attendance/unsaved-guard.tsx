"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";

type UnsavedStore = { set: (dirty: boolean) => void; get: () => boolean };

/**
 * Lets the attendance sheet tell links elsewhere on the page (the session list,
 * the tabs) that it holds unsaved marks, so they can ask before navigating away.
 * Backed by a ref rather than state: nothing needs to re-render when it flips.
 */

const UnsavedContext = createContext<UnsavedStore | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const dirtyRef = useRef(false);
  const store = useMemo<UnsavedStore>(
    () => ({
      set: (dirty) => {
        dirtyRef.current = dirty;
      },
      get: () => dirtyRef.current,
    }),
    [],
  );
  return <UnsavedContext.Provider value={store}>{children}</UnsavedContext.Provider>;
}

/**
 * Registers unsaved changes: warns on tab close / reload, and (inside an
 * UnsavedChangesProvider) makes every GuardedLink confirm first.
 */
export function useUnsavedChanges(dirty: boolean) {
  const t = useT();
  const shared = useContext(UnsavedContext);

  useEffect(() => {
    if (!shared) return;
    shared.set(dirty);
    return () => shared.set(false);
  }, [dirty, shared]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy browsers need returnValue set to show the prompt.
      e.returnValue = t("payments.attendance.unsavedWarning");
      return e.returnValue;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, t]);
}

/** A next/link that asks before leaving while the sheet has unsaved marks. */
export function GuardedLink({ onNavigate, ...props }: ComponentProps<typeof Link>) {
  const t = useT();
  const store = useContext(UnsavedContext);
  return (
    <Link
      {...props}
      onNavigate={(e) => {
        if (store?.get() && !window.confirm(t("payments.attendance.unsavedWarning"))) {
          e.preventDefault();
          return;
        }
        onNavigate?.(e);
      }}
    />
  );
}
