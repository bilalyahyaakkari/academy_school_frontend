import Link from "next/link";
import { notFound } from "next/navigation";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { GroupDangerZone } from "@/components/groups/group-danger-zone";
import { formatAge, formatCurrency } from "@/lib/utils";
import { Pencil, Clock } from "lucide-react";

type Params = Promise<{ id: string }>;

export default async function GroupDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  let group;
  try {
    group = await groupsApi.get(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        description={`${group.students.length} students • ${formatCurrency(group.monthlyFee)}/month`}
        backHref="/groups"
        backLabel="Back to groups"
        actions={
          <Button asChild>
            <Link href={`/groups/${group.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {group.schedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions configured.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {group.schedule.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="font-medium">{s.day}</span>
                    <span className="text-muted-foreground">
                      {s.startTime} – {s.endTime}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-6 text-sm">
            <Row label="Coach" value={group.coachName ?? "—"} />
            <Row
              label="Age range"
              value={
                group.minAge != null || group.maxAge != null
                  ? `${group.minAge ?? "?"}–${group.maxAge ?? "?"}`
                  : "—"
              }
            />
            <Row label="Monthly fee" value={formatCurrency(group.monthlyFee)} />
            <Row
              label="Capacity"
              value={`${group.students.length}${group.maxCapacity ? ` / ${group.maxCapacity}` : ""}`}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {group.students.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No students assigned to this group.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link href={`/students/${s.id}`} className="hover:underline">
                        {s.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{formatAge(s.dateOfBirth)}</TableCell>
                    <TableCell>
                      {s.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <GroupDangerZone groupId={group.id} groupName={group.name} studentCount={group.students.length} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
