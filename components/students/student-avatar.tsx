import { cn } from "@/lib/utils";

// Palette steps only. Dark fills get white initials, light fills get sea-950 /
// sea-900 so the text stays readable on every swatch.
const SWATCHES = [
  "bg-sea-900 text-white",
  "bg-sea-800 text-white",
  "bg-gradient-to-br from-sea-800 to-sea-900 text-white",
  "bg-sea-500 text-sea-950",
  "bg-sea-300 text-sea-900",
  "bg-gradient-to-br from-sea-300 to-sea-500 text-sea-950",
];

/** Stable hash → swatch: same student always gets the same color. */
function swatchFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return SWATCHES[Math.abs(hash) % SWATCHES.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StudentAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const g = swatchFor(name);
  const sizeClasses =
    size === "sm" ? "size-7 text-[10px]" : size === "lg" ? "size-12 text-sm" : "size-9 text-xs";

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold shadow-sm ring-2 ring-background transition-transform",
        g,
        sizeClasses,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
