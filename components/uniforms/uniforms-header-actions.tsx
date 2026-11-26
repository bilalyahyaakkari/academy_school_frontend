"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal, Plus, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n/client";
import { UniformDialog } from "./uniform-dialog";

type StudentOption = { id: string; fullName: string };

/** Page-header actions: primary "New order" + a "More" menu. */
export function UniformsHeaderActions({
  students,
  knownSizes,
}: {
  students: StudentOption[];
  knownSizes: string[];
}) {
  const t = useT();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Button onClick={() => setCreating(true)}>
        <Plus className="size-4" />
        {t("uniforms.action.new")}
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <MoreHorizontal className="size-4" />
            {t("uniforms.action.more")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild className="min-h-10 cursor-pointer sm:min-h-0">
            <Link href="/uniforms/bulk">
              <Users className="me-2 size-4" />
              {t("uniforms.action.bulk")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-10 cursor-pointer sm:min-h-0">
            <Link href="/uniforms/import">
              <Upload className="me-2 size-4" />
              {t("uniforms.action.import")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {creating && (
        <UniformDialog
          students={students}
          knownSizes={knownSizes}
          onClose={() => setCreating(false)}
          mode="create"
        />
      )}
    </>
  );
}
