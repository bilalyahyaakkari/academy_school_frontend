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
import { ACADEMY_TZ, intlLocale } from "@/lib/utils";

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

  // Fixed timezone + locale so the server render and the browser agree.
  const today = new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: ACADEMY_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/90 px-4 text-secondary-foreground backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav academyName={academyName} />
        <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs text-secondary-foreground sm:flex">
          <Calendar className="size-3.5 text-sea-700" />
          <span>{today}</span>
        </div>
      </div>

      <div className="ms-auto flex items-center gap-1">
        <LocaleSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 gap-2 px-2">
              <div className="grid size-8 place-items-center rounded-full bg-sea-800 text-xs font-semibold text-white ring-2 ring-sea-100">
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
