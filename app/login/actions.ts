"use server";

import { signIn } from "@/auth";
import { AuthError, CredentialsSignin } from "next-auth";

export async function signInAction(formData: FormData): Promise<{ error?: string } | undefined> {
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
          return {
            error:
              "Can't reach the server — your login is probably fine. Check that the backend and database are up, then try again.",
          };
        }
        return { error: "Invalid email or password" };
      }
      return { error: "Could not sign in. Please try again." };
    }
    throw err;
  }
}
