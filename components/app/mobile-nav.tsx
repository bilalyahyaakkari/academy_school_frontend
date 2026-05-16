"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_SECTIONS } from "./nav-config";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export function MobileNav({ academyName }: { academyName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 start-0 z-50 flex h-full w-72 flex-col border-e border-slate-800 bg-slate-950 text-slate-200 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left rtl:data-[state=closed]:slide-out-to-right rtl:data-[state=open]:slide-in-from-right"
        >
          <DialogPrimitive.Title className="sr-only">
            Navigation
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Main navigation menu
          </DialogPrimitive.Description>

          {/* Subtle radial accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_30%_0%,rgba(59,130,246,0.18),transparent_60%)]"
          />

          {/* Brand + close */}
          <div className="relative flex h-24 items-center justify-between gap-3 border-b border-slate-800/80 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/40 via-fuchsia-500/30 to-cyan-500/40 blur-xl" />
                <Image
                  src="/logo.png"
                  alt={academyName}
                  width={72}
                  height={72}
                  className="relative size-16 shrink-0 object-contain"
                />
              </div>
              <p className="truncate text-base font-bold tracking-tight text-white">
                {academyName}
              </p>
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Nav items */}
          <nav className="relative flex-1 overflow-y-auto px-3 py-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.labelKey} className="mb-5 last:mb-0">
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {t(section.labelKey)}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium transition-all active:scale-[0.98]",
                          active
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-white active:bg-slate-800/80",
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span className="flex-1 truncate">
                          {t(item.labelKey)}
                        </span>
                        {active && (
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
