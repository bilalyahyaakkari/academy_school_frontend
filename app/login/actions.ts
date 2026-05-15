"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

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
        return { error: "Invalid email or password" };
      }
      return { error: "Could not sign in. Please try again." };
    }
    throw err;
  }
}
