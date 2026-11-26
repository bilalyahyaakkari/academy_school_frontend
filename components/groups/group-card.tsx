import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { getLocale, getT } from "@/lib/i18n/server";
import type { ScheduleSlot } from "@/lib/api/types";
import {
  ageLabel,
  moreSessionsLabel,
  playersLabel,
  summarizeSchedule,
} from "./group-format";
import { Check, Clock, Pencil, User as UserIcon, UsersRound, UserX } from "lucide-react";

type GroupCardProps = {
  /** Where clicking the card goes — `/groups?group=<id>`. */
  href: string;
  selected: boolean;
  name: string;
  studentCount: number;
} & (
  | {
      kind: "group";
      id: string;
      minAge: number | null;
      maxAge: number | null;
      maxCapacity: number | null;
      monthlyFee: number;
      schedule: ScheduleSlot[];
      coachName: string | null;
    }
  | { kind: "unassigned" }
);

/**
 * One selectable group card. The whole card is a link (a stretched ::after
 * on the name link) that selects the group through the URL; the Edit link
 * sits above it so both stay clickable without nesting anchors.
 */
export async function GroupCard(props: GroupCardProps) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { href, selected, name, studentCount } = props;
  const isGroup = props.kind === "group";

  const max = isGroup ? props.maxCapacity : null;
  const over = max != null && studentCount > max;
  const full = max != null && studentCount === max;
  const fill = max ? Math.min(100, Math.round((studentCount / max) * 100)) : 0;

  const ages = isGroup ? ageLabel(t, props.minAge, props.maxAge) : t("groups.unassigned.sub");
  const schedule = isGroup ? summarizeSchedule(t, props.schedule, locale) : null;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-xl border bg-card p-4 text-card-foreground transition-[border-color,box-shadow]",
        selected
          ? "border-primary shadow-md ring-2 ring-primary/20"
          : cn(
              "shadow-sm hover:border-sea-500 hover:shadow-md",
              isGroup ? "border-border" : "border-dashed border-sea-300",
            ),
      )}
    >
      {selected && (
        <span
          aria-hidden
          className="absolute end-3 top-3 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}

      <h3 className="pe-8 text-lg font-bold leading-tight tracking-tight">
        <Link
          href={href}
          scroll={false}
          aria-current={selected ? "page" : undefined}
          className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
        >
          {!isGroup && <UserX aria-hidden className="me-1.5 inline size-4 align-[-2px]" />}
          {name}
        </Link>
      </h3>
      {ages && <p className="mt-0.5 text-sm text-muted-foreground">{ages}</p>}

      {/* Players / capacity */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-medium",
              over && "text-destructive",
            )}
          >
            <UsersRound aria-hidden className="size-4 opacity-70" />
            <span className="tabular-nums">{playersLabel(t, studentCount, max)}</span>
          </span>
          {over ? (
            <Badge variant="alert">{t("groups.card.overCapacity")}</Badge>
          ) : full ? (
            <Badge variant="warning">{t("groups.card.full")}</Badge>
          ) : null}
        </div>
        {max != null && (
          <div aria-hidden className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", over ? "bg-destructive" : "bg-primary")}
              style={{ width: `${fill}%` }}
            />
          </div>
        )}
      </div>

      {isGroup && (
        <>
          <p className="mt-4 flex items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight">
              {formatCurrency(props.monthlyFee)}
            </span>
            <span className="text-xs text-muted-foreground">{t("groups.card.perMonth")}</span>
          </p>

          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            {schedule && schedule.lines.length > 0 ? (
              <>
                {schedule.lines.map((line) => (
                  <p key={line.time} className="flex items-start gap-1.5">
                    <Clock aria-hidden className="mt-px size-3.5 shrink-0" />
                    <span>
                      <span className="font-medium text-foreground">{line.days}</span>
                      <span aria-hidden> · </span>
                      <span dir="ltr" className="tabular-nums">
                        {line.time}
                      </span>
                    </span>
                  </p>
                ))}
                {schedule.hiddenSessions > 0 && (
                  <p className="ps-5">{moreSessionsLabel(t, schedule.hiddenSessions)}</p>
                )}
              </>
            ) : (
              <p className="flex items-center gap-1.5">
                <Clock aria-hidden className="size-3.5 shrink-0" />
                {t("groups.card.noSchedule")}
              </p>
            )}
            {props.coachName && (
              <p className="flex items-center gap-1.5">
                <UserIcon aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">{props.coachName}</span>
              </p>
            )}
          </div>

          <div className="mt-auto flex justify-end pt-3">
            {/* relative z-10 lifts it above the card's stretched link. */}
            <Link
              href={`/groups/${props.id}/edit`}
              aria-label={t("groups.action.editName", { name })}
              className="relative z-10 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil aria-hidden className="size-3.5" />
              {t("common.edit")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
