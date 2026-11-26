"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import type { UniformWithStudent } from "@/lib/api/types";
import {
  DeliveryToggle,
  LeftBadge,
  PaymentProgress,
  RowActions,
  SizeChip,
  SupplierOrderChip,
  type RowHandlers,
} from "./uniform-row-parts";

type ListProps = {
  rows: UniformWithStudent[];
  selected: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  onToggleOne: (id: string) => void;
  onToggleAll: () => void;
  handlers: RowHandlers;
};

/** Desktop table (md+) and compact mobile cards (< md). */
export function UniformsList(props: ListProps) {
  return (
    <>
      <UniformsTable {...props} />
      <UniformsCards {...props} />
    </>
  );
}

function StudentName({ u, className }: { u: UniformWithStudent; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Link
        href={`/students/${u.student.id}`}
        className="truncate font-medium hover:underline"
      >
        {u.student.fullName}
      </Link>
      {u.student.archived && <LeftBadge />}
    </div>
  );
}

function UniformsTable({
  rows,
  selected,
  allSelected,
  someSelected,
  onToggleOne,
  onToggleAll,
  handlers,
}: ListProps) {
  const t = useT();
  const locale = useLocale();

  return (
    <Card className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                aria-label={t("uniforms.aria.selectAll")}
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={onToggleAll}
              />
            </TableHead>
            <TableHead>{t("table.student")}</TableHead>
            <TableHead className="w-32">{t("uniforms.table.size")}</TableHead>
            <TableHead className="w-44">{t("uniforms.table.payment")}</TableHead>
            <TableHead className="w-32">{t("uniforms.table.received")}</TableHead>
            <TableHead className="text-end">
              <span className="sr-only">{t("table.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((u) => {
            const isSelected = selected.has(u.id);
            return (
              <TableRow
                key={u.id}
                data-state={isSelected ? "selected" : undefined}
                className={cn(isSelected && "bg-primary/5")}
              >
                <TableCell>
                  <Checkbox
                    aria-label={t("uniforms.aria.select", { name: u.student.fullName })}
                    checked={isSelected}
                    onCheckedChange={() => onToggleOne(u.id)}
                  />
                </TableCell>
                <TableCell className="max-w-72">
                  <StudentName u={u} />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("uniforms.row.ordered", {
                      date: formatDate(u.orderedAt, locale),
                    })}
                  </p>
                  {u.notes && (
                    <p
                      className="mt-0.5 truncate text-xs text-muted-foreground/80"
                      title={u.notes}
                    >
                      {u.notes}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SizeChip size={u.size} />
                    {u.supplierOrder && <SupplierOrderChip order={u.supplierOrder} />}
                  </div>
                </TableCell>
                <TableCell>
                  <PaymentProgress u={u} className="w-36" />
                </TableCell>
                <TableCell>
                  <DeliveryToggle
                    u={u}
                    pending={handlers.pendingId === u.id}
                    onToggle={() => handlers.onToggleReceived(u)}
                  />
                </TableCell>
                <TableCell>
                  <RowActions u={u} h={handlers} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function UniformsCards({ rows, selected, onToggleOne, handlers }: ListProps) {
  const t = useT();

  return (
    <ul className="space-y-2 md:hidden">
      {rows.map((u) => {
        const isSelected = selected.has(u.id);
        return (
          <li
            key={u.id}
            className={cn(
              "rounded-xl border border-border bg-card p-3 transition-colors",
              isSelected && "border-primary/40 bg-primary/5",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="-m-1.5 grid size-10 shrink-0 place-items-center">
                <Checkbox
                  aria-label={t("uniforms.aria.select", { name: u.student.fullName })}
                  checked={isSelected}
                  onCheckedChange={() => onToggleOne(u.id)}
                />
              </span>
              <StudentName u={u} className="flex-1" />
              {u.supplierOrder && <SupplierOrderChip order={u.supplierOrder} />}
              <SizeChip size={u.size} />
            </div>

            <PaymentProgress u={u} className="mt-2" />

            <div className="mt-3 flex items-center justify-between gap-2">
              <DeliveryToggle
                u={u}
                pending={handlers.pendingId === u.id}
                onToggle={() => handlers.onToggleReceived(u)}
              />
              <RowActions u={u} h={handlers} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
