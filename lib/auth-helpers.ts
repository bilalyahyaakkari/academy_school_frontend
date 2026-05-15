import { auth } from "@/auth";
import { redirect } from "next/navigation";

/** Use in server components / actions to ensure an authenticated session. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}
