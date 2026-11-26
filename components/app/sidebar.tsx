"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { NAV_SECTIONS } from "./nav-config";

export function Sidebar({
  academyName,
  collapsed = false,
  onToggle,
}: {
  academyName: string;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-30 hidden flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* ===== Brand ===== */}
      <div
        className={cn(
          "relative flex h-28 items-center gap-3 border-b border-sidebar-border transition-[padding] duration-300",
          collapsed ? "justify-center px-2" : "px-3",
        )}
      >
        <div className="relative shrink-0">
          <Image
            src="/logo.png"
            alt={academyName}
            width={96}
            height={96}
            className={cn(
              "relative shrink-0 object-contain transition-all duration-300",
              collapsed ? "size-14" : "size-20",
            )}
            priority
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold tracking-tight text-white">
              {academyName}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">
              {t("brand.adminConsole")}
            </p>
          </div>
        )}
      </div>

      {/* ===== Navigation ===== */}
      <nav
        className={cn(
          "relative flex-1 overflow-y-auto py-4 transition-[padding] duration-300",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.labelKey} className="mb-5 last:mb-0">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
                {t(section.labelKey)}
              </p>
            )}
            {collapsed && (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" />
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? t(item.labelKey) : undefined}
                    className={cn(
                      "group relative flex items-center overflow-hidden rounded-xl text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-300 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                      collapsed
                        ? "size-12 justify-center"
                        : "gap-3 px-3 py-2.5",
                      active
                        ? "bg-sidebar-active font-semibold text-sidebar-active-foreground shadow-sm"
                        : "text-sidebar-muted hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    <Icon
                      className={cn(
                        "relative size-4 shrink-0 transition-colors duration-200",
                        active ? "text-sea-900" : "group-hover:text-sea-300",
                      )}
                    />
                    {!collapsed && (
                      <span className="relative flex-1 truncate">
                        {t(item.labelKey)}
                      </span>
                    )}
                    {!collapsed && active && (
                      <span
                        aria-hidden
                        className="relative size-1.5 rounded-full bg-sea-900"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ===== Footer — collapse toggle ===== */}
      {onToggle && (
        <div
          className={cn(
            "relative border-t border-sidebar-border transition-[padding] duration-300",
            collapsed ? "p-2" : "p-3",
          )}
        >
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              collapsed ? t("shell.sidebar.expand") : t("shell.sidebar.collapse")
            }
            title={
              collapsed ? t("shell.sidebar.expand") : t("shell.sidebar.collapse")
            }
            className={cn(
              "group flex w-full items-center rounded-lg text-sm font-medium text-sidebar-muted transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-300",
              collapsed
                ? "h-10 justify-center"
                : "gap-2 justify-center px-3 py-2",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="size-5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            ) : (
              <>
                <ChevronsLeft className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
                <span>{t("brand.collapse")}</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
