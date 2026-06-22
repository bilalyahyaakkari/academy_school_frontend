import { uniformsApi } from "@/lib/api/uniforms";
import { studentsApi } from "@/lib/api/students";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { UniformsClient } from "@/components/uniforms/uniforms-client";
import { formatCurrency, cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shirt,
  PackageCheck,
} from "lucide-react";

export const metadata = { title: "Uniforms — Academy" };

type StatTone = "blue" | "green" | "amber" | "rose";

const TONES: Record<
  StatTone,
  { bar: string; blob: string; iconBg: string; valueText: string; drift: string }
> = {
  blue: {
    bar: "from-blue-500 via-blue-500 to-cyan-400",
    blob: "bg-blue-400/40",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    valueText: "",
    drift: "animate-drift-1",
  },
  green: {
    bar: "from-emerald-500 via-emerald-500 to-teal-400",
    blob: "bg-emerald-400/40",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
    valueText: "text-emerald-600 dark:text-emerald-400",
    drift: "animate-drift-2",
  },
  amber: {
    bar: "from-amber-500 via-orange-500 to-red-500",
    blob: "bg-orange-400/40",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    valueText: "text-amber-600 dark:text-amber-400",
    drift: "animate-drift-3",
  },
  rose: {
    bar: "from-rose-500 via-pink-500 to-rose-400",
    blob: "bg-rose-400/40",
    iconBg: "bg-gradient-to-br from-rose-500 to-rose-600 text-white",
    valueText: "text-rose-600 dark:text-rose-400",
    drift: "animate-drift-1",
  },
};

export default async function UniformsPage() {
  const t = await getT();
  const [uniforms, students] = await Promise.all([
    uniformsApi.list(),
    studentsApi.list({}),
  ]);

  const totalRevenue = uniforms
    .filter((u) => u.isPaid)
    .reduce((sum, u) => sum + u.price, 0);
  const totalOutstanding = uniforms
    .filter((u) => !u.isPaid)
    .reduce((sum, u) => sum + u.price, 0);
  const paidCount = uniforms.filter((u) => u.isPaid).length;
  const unpaidCount = uniforms.filter((u) => !u.isPaid).length;
  const receivedCount = uniforms.filter((u) => u.isReceived).length;
  const pendingReceiveCount = uniforms.length - receivedCount;

  // Tally per size. Canonical sizes (S/M/L/XL) come first in the listed order,
  // any custom sizes follow alphabetically.
  const CANONICAL = ["S", "M", "L", "XL"];
  const sizeTotals = new Map<
    string,
    { total: number; paid: number; received: number }
  >();
  for (const u of uniforms) {
    const key = u.size?.trim() || "—";
    const cur = sizeTotals.get(key) ?? { total: 0, paid: 0, received: 0 };
    cur.total += 1;
    if (u.isPaid) cur.paid += 1;
    if (u.isReceived) cur.received += 1;
    sizeTotals.set(key, cur);
  }
  const sizeBreakdown = Array.from(sizeTotals.entries())
    .sort(([a], [b]) => {
      const ai = CANONICAL.indexOf(a);
      const bi = CANONICAL.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("uniforms.title")}
        description={t("uniforms.desc")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          label={t("uniforms.stat.orders")}
          value={String(uniforms.length)}
          icon={<ShoppingBag className="size-5" />}
          tone="blue"
        />
        <Stat
          label={t("uniforms.stat.received")}
          value={String(receivedCount)}
          sub={
            pendingReceiveCount > 0
              ? t("uniforms.stat.received.sub", { pending: pendingReceiveCount })
              : t("uniforms.stat.received.allDelivered")
          }
          icon={<PackageCheck className="size-5" />}
          tone="blue"
        />
        <Stat
          label={t("uniforms.stat.paid")}
          value={String(paidCount)}
          icon={<CheckCircle2 className="size-5" />}
          tone="green"
        />
        <Stat
          label={t("uniforms.stat.unpaid")}
          value={String(unpaidCount)}
          icon={<Clock className="size-5" />}
          tone="amber"
        />
        <Stat
          label={t("uniforms.stat.outstanding")}
          value={formatCurrency(totalOutstanding)}
          sub={t("uniforms.stat.outstanding.sub", {
            collected: formatCurrency(totalRevenue),
          })}
          icon={<AlertCircle className="size-5" />}
          tone={totalOutstanding > 0 ? "rose" : "green"}
        />
      </div>

      {sizeBreakdown.length > 0 && (
        <Card className="group relative overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-44 animate-drift-1 rounded-full bg-indigo-400/30 blur-3xl"
          />
          <CardContent className="relative pt-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md">
                <Shirt className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {t("uniforms.bySize.title")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("uniforms.bySize.desc")}
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sizeBreakdown.map(([size, { total, paid, received }]) => {
                const pendingReceive = total - received;
                const pendingPay = total - paid;
                return (
                  <div
                    key={size}
                    className="group/chip flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-base font-bold text-white shadow-sm">
                      {size}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xl font-bold leading-none tracking-tight">
                        {total}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {t("uniforms.bySize.total")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[11px]">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
                          pendingReceive === 0
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        )}
                        title={t("uniforms.bySize.receivedTooltip", {
                          received,
                          pending: pendingReceive,
                        })}
                      >
                        <PackageCheck className="size-3" />
                        {received}/{total}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
                          pendingPay === 0
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                        )}
                        title={t("uniforms.bySize.paidTooltip", {
                          paid,
                          pending: pendingPay,
                        })}
                      >
                        <CheckCircle2 className="size-3" />
                        {paid}/{total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <UniformsClient
        uniforms={uniforms}
        students={students.map((s) => ({ id: s.id, fullName: s.fullName }))}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone: StatTone;
}) {
  const t = TONES[tone];
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Top accent bar */}
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", t.bar)}
      />

      {/* Drifting glow blob */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-3xl",
          t.blob,
          t.drift,
        )}
      />

      <CardContent className="relative pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                "mt-2 text-3xl font-bold tracking-tight",
                t.valueText,
              )}
            >
              {value}
            </p>
            {sub && (
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
          <div
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-xl shadow-md transition-transform group-hover:scale-110",
              t.iconBg,
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
