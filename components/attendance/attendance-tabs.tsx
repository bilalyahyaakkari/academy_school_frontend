import { GuardedLink } from "./unsaved-guard";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { CalendarCheck, History } from "lucide-react";

export type AttendanceTab = "today" | "history";

/**
 * Today / History. They're links (the tab lives in the URL, so it survives a
 * refresh and works without JS), so this is a nav with aria-current rather
 * than an ARIA tablist.
 */
export async function AttendanceTabs({
  active,
  historyHref,
}: {
  active: AttendanceTab;
  historyHref: string;
}) {
  const t = await getT();
  const tabs = [
    { id: "today" as const, href: "/attendance?tab=today", label: t("attendance.tab.today"), Icon: CalendarCheck },
    { id: "history" as const, href: historyHref, label: t("attendance.tab.history"), Icon: History },
  ];

  return (
    <nav aria-label={t("attendance.tabs.label")} className="border-b border-border">
      <ul className="-mb-px flex gap-1">
        {tabs.map(({ id, href, label, Icon }) => {
          const current = id === active;
          return (
            <li key={id}>
              <GuardedLink
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-t-md border-b-2 px-4 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  current
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-sea-300 hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </GuardedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
