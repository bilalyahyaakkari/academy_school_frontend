"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { LogOut, ChevronDown, Calendar } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { LocaleSwitcher } from "./locale-switcher";
import { useLocale, useT } from "@/lib/i18n/client";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TopBar({
  userName,
  academyName,
}: {
  userName: string;
  academyName: string;
}) {
  const initials = getInitials(userName);
  const locale = useLocale();
  const t = useT();

  const today = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-gradient-to-r from-background via-background to-primary/[0.04] px-4 backdrop-blur-md sm:px-6">
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />

      <div className="flex items-center gap-2">
        <MobileNav academyName={academyName} />
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <Calendar className="size-3.5 text-primary" />
          <span>{today}</span>
        </div>
      </div>

      <div className="ms-auto flex items-center gap-1">
        <LocaleSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 gap-2 px-2">
              <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-500/30 ring-2 ring-background">
                {initials}
              </div>
              <span className="hidden text-sm font-medium sm:inline">
                {userName}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-semibold">{userName}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {t("topbar.signedInAs")}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full cursor-pointer">
                  <LogOut className="me-2 size-4" />
                  {t("topbar.signOut")}
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
