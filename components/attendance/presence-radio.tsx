"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Check, X } from "lucide-react";

export type Mark = "present" | "absent";

/**
 * The Present / Absent pair for one player. Native radio inputs (one name per
 * row) give the keyboard behaviour for free: Tab moves between players, the
 * arrow keys flip between Present and Absent, Space marks. Neither is checked
 * until someone marks the player.
 */
export function PresenceRadio({
  name,
  value,
  onChange,
  labelledBy,
  disabled,
}: {
  /** Unique per row — groups the two radios. */
  name: string;
  value: Mark | undefined;
  onChange: (value: Mark) => void;
  /** id of the element holding the player's name. */
  labelledBy: string;
  disabled?: boolean;
}) {
  const t = useT();
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="inline-flex items-center gap-1.5 sm:gap-2"
    >
      <Option
        name={name}
        mark="present"
        checked={value === "present"}
        onChange={onChange}
        disabled={disabled}
        label={t("attendance.sheet.present")}
      />
      <Option
        name={name}
        mark="absent"
        checked={value === "absent"}
        onChange={onChange}
        disabled={disabled}
        label={t("attendance.sheet.absent")}
      />
    </div>
  );
}

function Option({
  name,
  mark,
  checked,
  onChange,
  disabled,
  label,
}: {
  name: string;
  mark: Mark;
  checked: boolean;
  onChange: (value: Mark) => void;
  disabled?: boolean;
  label: string;
}) {
  const Icon = mark === "present" ? Check : X;
  return (
    <label
      className={cn(
        // 44px tall on phones — easy to hit at the side of the pitch.
        "relative inline-flex h-11 min-w-11 cursor-pointer select-none items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors sm:h-9",
        "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-1 has-[input:focus-visible]:ring-offset-card",
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60",
        checked
          ? mark === "present"
            ? "border-success bg-success text-success-foreground"
            : "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-card text-muted-foreground hover:border-sea-300 hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <input
        type="radio"
        name={name}
        value={mark}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(mark)}
        className="sr-only"
      />
      {/* A drawn radio dot, like a paper register; the icon carries the
          meaning when the label is hidden on very narrow phones. */}
      <span
        aria-hidden
        className={cn(
          "hidden size-4 shrink-0 place-items-center rounded-full border-2 sm:grid",
          checked ? "border-current" : "border-input",
        )}
      >
        {checked && <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <Icon aria-hidden className="size-4 shrink-0 sm:hidden" />
      <span className="max-[380px]:sr-only">{label}</span>
    </label>
  );
}
