"use server";

import { signIn } from "@/auth";
import { AuthError, CredentialsSignin } from "next-auth";

export type SignInErrorCode = "backend_unavailable" | "invalid" | "generic";

/** On failure returns a code; the form shows it in the active language. */
export async function signInAction(
  formData: FormData,
): Promise<{ error?: SignInErrorCode } | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        // Set by auth.ts when the backend or its database never answered, so
        // the page doesn't blame the password for a server problem.
        if ((err as CredentialsSignin).code === "backend_unavailable") {
          return { error: "backend_unavailable" };
        }
        return { error: "invalid" };
      }
      return { error: "generic" };
    }
    throw err;
  }
}
