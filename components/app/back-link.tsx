"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/**
 * "‹ Back" link used by PageHeader. Client component so the default label can
 * follow the active locale, and the chevron points the way back in RTL too.
 */
export function BackLink({ href, label }: { href: string; label?: string }) {
  const t = useT();
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
      {label ?? t("common.back")}
    </Link>
  );
}
