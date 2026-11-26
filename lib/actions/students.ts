"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { studentsApi } from "@/lib/api/students";
import { ApiError } from "@/lib/api/client";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Works out the date of birth to send.
 *
 * The form only asks for the birth year, but the database keeps a full date
 * (imports can carry the real day). When the year is unchanged we send the
 * original date back untouched; only a changed year (or a new student) gets
 * the placeholder "YYYY-01-01".
 */
function resolveDateOfBirth(yearRaw: string, originalDob: string): string {
  const year = yearRaw.trim();
  const original = originalDob.trim();
  if (original && /^\d{4}-\d{2}-\d{2}/.test(original) && original.slice(0, 4) === year) {
    return original.slice(0, 10);
  }
  if (/^\d{4}$/.test(year)) return `${year}-01-01`;
  // Let the backend's validation report anything else.
  return year;
}

function buildPayload(formData: FormData) {
  const str = (key: string) => {
    const v = formData.get(key);
    return v == null ? "" : String(v).trim();
  };
  const groupId = str("groupId");
  const feeStr = str("monthlyFee");

  return {
    fullName: str("fullName"),
    dateOfBirth: resolveDateOfBirth(str("birthYear"), str("originalDateOfBirth")),
    // Always sent: an emptied field clears the value (null), a filled one sets it.
    address: str("address") || null,
    school: str("school") || null,
    phoneNumber: str("phoneNumber") || undefined,
    groupId: groupId || null,
    monthlyFee: feeStr === "" ? null : Number(feeStr),
    notes: str("notes") || undefined,
  };
}

async function errorMessage(err: unknown, fallback: TranslationKey): Promise<string> {
  if (err instanceof ApiError) return err.message;
  const t = await getT();
  return t(fallback);
}

export async function createStudent(formData: FormData): Promise<ActionResult> {
  let createdId: string | undefined;
  try {
    const created = await studentsApi.create(buildPayload(formData));
    createdId = created.id;
  } catch (err) {
    return { success: false, error: await errorMessage(err, "students.error.create") };
  }
  revalidatePath("/students");
  revalidatePath("/dashboard");
  revalidatePath("/roster");
  redirect(`/students/${createdId}`);
}

export async function updateStudent(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await studentsApi.update(id, buildPayload(formData));
  } catch (err) {
    return { success: false, error: await errorMessage(err, "students.error.update") };
  }
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/dashboard");
  // Effective fee may have changed → unpaid invoices were updated server-side.
  revalidatePath("/payments");
  revalidatePath("/payments/outstanding");
  redirect(`/students/${id}`);
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  try {
    await studentsApi.remove(id);
  } catch (err) {
    return { success: false, error: await errorMessage(err, "students.error.delete") };
  }
  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect("/students");
}

export async function archiveStudent(id: string): Promise<ActionResult> {
  try {
    await studentsApi.archive(id);
  } catch (err) {
    return { success: false, error: await errorMessage(err, "students.error.archive") };
  }
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/uniforms");
  revalidatePath("/roster");
  revalidatePath(`/students/${id}`);
  return { success: true };
}

export async function unarchiveStudent(id: string): Promise<ActionResult> {
  try {
    await studentsApi.unarchive(id);
  } catch (err) {
    return { success: false, error: await errorMessage(err, "students.error.restore") };
  }
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/uniforms");
  revalidatePath("/roster");
  revalidatePath(`/students/${id}`);
  return { success: true };
}

export async function bulkDeleteStudents(
  ids: string[],
): Promise<{ success: true; deleted: number } | { success: false; error: string }> {
  if (ids.length === 0) {
    const t = await getT();
    return { success: false, error: t("students.error.noneSelected") };
  }
  let deleted = 0;
  try {
    const res = await studentsApi.bulkDelete(ids);
    deleted = res.deleted;
  } catch (err) {
    return { success: false, error: await errorMessage(err, "students.error.bulkDelete") };
  }
  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { success: true, deleted };
}

// ---------- Siblings ----------

/**
 * Linking / unlinking changes every family member's page and re-prices their
 * unpaid invoices on the backend (sibling discount), so refresh all of them.
 */
function revalidateFamily() {
  revalidatePath("/students");
  revalidatePath("/students/[id]", "page");
  revalidatePath("/payments");
  revalidatePath("/payments/outstanding");
}

export type SiblingCandidate = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  archived: boolean;
  familyId: string | null;
  group: { id: string; name: string } | null;
};

/** Every student (current and left), for the "Link sibling" search. */
export async function listSiblingCandidates(): Promise<
  { success: true; students: SiblingCandidate[] } | { success: false; error: string }
> {
  try {
    const all = await studentsApi.list({ archived: "include" });
    return {
      success: true,
      students: all.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        phoneNumber: s.phoneNumber,
        archived: s.archived,
        familyId: s.familyId ?? null,
        group: s.group ? { id: s.group.id, name: s.group.name } : null,
      })),
    };
  } catch (err) {
    return { success: false, error: await errorMessage(err, "students.error.loadStudents") };
  }
}

export async function linkSibling(id: string, siblingId: string): Promise<ActionResult> {
  try {
    await studentsApi.linkSibling(id, siblingId);
  } catch (err) {
    return { success: false, error: await errorMessage(err, "students.error.linkSibling") };
  }
  revalidateFamily();
  return { success: true };
}

/** Takes `siblingId` out of its family (the page it's done from stays linked to the rest). */
export async function unlinkSibling(siblingId: string): Promise<ActionResult> {
  try {
    await studentsApi.unlinkSibling(siblingId);
  } catch (err) {
    return { success: false, error: await errorMessage(err, "students.error.unlinkSibling") };
  }
  revalidateFamily();
  return { success: true };
}
