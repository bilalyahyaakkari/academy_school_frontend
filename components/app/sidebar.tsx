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
        "fixed inset-y-0 start-0 z-30 hidden flex-col border-e border-white/[0.06] bg-slate-950 text-slate-200 transition-[width] duration-300 ease-out md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* ===== Layered animated background ===== */}
      <div
        aria-hidden
        className="pointer-events-none absolute -start-20 -top-20 size-72 animate-drift-1 rounded-full bg-blue-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -end-24 top-1/3 size-72 animate-drift-2 rounded-full bg-fuchsia-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -start-10 size-80 animate-drift-3 rounded-full bg-cyan-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]"
      />

      {/* ===== Brand ===== */}
      <div
        className={cn(
          "relative flex h-28 items-center gap-3 border-b border-white/[0.06] transition-[padding] duration-300",
          collapsed ? "justify-center px-2" : "px-3",
        )}
      >
        <div className="relative shrink-0">
          {/* Soft glow behind the logo */}
          <div className="absolute inset-0 animate-pulse-glow rounded-full bg-gradient-to-br from-blue-500/40 via-fuchsia-500/30 to-cyan-500/40 blur-2xl" />
          <Image
            src="/logo.png"
            alt={academyName}
            width={96}
            height={96}
            className={cn(
              "relative shrink-0 animate-float-bob object-contain transition-all duration-300",
              collapsed ? "size-14" : "size-20",
            )}
            priority
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-base font-bold tracking-tight text-transparent">
              {academyName}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
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
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {t(section.labelKey)}
              </p>
            )}
            {collapsed && (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
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
                      "group relative flex items-center overflow-hidden rounded-xl text-sm font-medium transition-all duration-300",
                      collapsed
                        ? "size-12 justify-center"
                        : "gap-3 px-3 py-2.5",
                      active
                        ? "text-white shadow-lg shadow-blue-500/30"
                        : "text-slate-400 hover:text-white",
                    )}
                  >
                    {active && (
                      <>
                        <span
                          aria-hidden
                          className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500"
                        />
                        <span
                          aria-hidden
                          className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                      </>
                    )}
                    {!active && (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-xl bg-white/0 backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/[0.06]"
                      />
                    )}

                    <Icon
                      className={cn(
                        "relative size-4 shrink-0 transition-all duration-300",
                        active
                          ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                          : "group-hover:scale-110 group-hover:text-blue-300",
                      )}
                    />
                    {!collapsed && (
                      <span className="relative flex-1 truncate">
                        {t(item.labelKey)}
                      </span>
                    )}
                    {!collapsed && active && (
                      <span className="relative flex size-2 items-center justify-center">
                        <span className="absolute size-2 animate-ping-slow rounded-full bg-white/80" />
                        <span className="relative size-1.5 rounded-full bg-white" />
                      </span>
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
            "relative border-t border-white/[0.06] bg-slate-950/60 backdrop-blur transition-[padding] duration-300",
            collapsed ? "p-2" : "p-3",
          )}
        >
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "group flex w-full items-center rounded-lg text-sm font-medium text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white",
              collapsed
                ? "h-10 justify-center"
                : "gap-2 justify-center px-3 py-2",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="size-5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            ) : (
              <>
                <ChevronsLeft className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180" />
                <span>{t("brand.collapse")}</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
