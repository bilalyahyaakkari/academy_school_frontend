import { signOut } from "@/auth";

/**
 * Reached when the backend rejects the session's token (401). Clears the
 * Auth.js cookie and sends the user to the login page.
 */
export async function GET() {
  await signOut({ redirectTo: "/login?expired=1" });
}
