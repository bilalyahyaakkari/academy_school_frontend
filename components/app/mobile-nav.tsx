"use client";

import { useState } from "react";
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

  // The menu closes when a link is clicked (see the Link onClick below) and
  // via Radix's onOpenChange (overlay click, Escape, the close button).

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("shell.menu.open")}
        >
          <Menu className="size-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-sea-950/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 start-0 z-50 flex h-full w-72 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left rtl:data-[state=closed]:slide-out-to-right rtl:data-[state=open]:slide-in-from-right"
        >
          <DialogPrimitive.Title className="sr-only">
            {t("shell.menu.title")}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t("shell.menu.desc")}
          </DialogPrimitive.Description>

          {/* Brand + close */}
          <div className="relative flex h-24 items-center justify-between gap-3 border-b border-sidebar-border px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">
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
                className="text-sidebar-muted hover:bg-white/[0.08] hover:text-white focus-visible:ring-sea-300"
                aria-label={t("shell.menu.close")}
              >
                <X className="size-5" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Nav items */}
          <nav className="relative flex-1 overflow-y-auto px-3 py-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.labelKey} className="mb-5 last:mb-0">
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
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
                          "flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-300 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                          active
                            ? "bg-sidebar-active font-semibold text-sidebar-active-foreground shadow-sm"
                            : "text-sidebar-muted hover:bg-white/[0.06] hover:text-white active:bg-white/[0.1]",
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span className="flex-1 truncate">
                          {t(item.labelKey)}
                        </span>
                        {active && (
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-sea-900"
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
