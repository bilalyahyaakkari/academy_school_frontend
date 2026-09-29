import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000/api";

type BackendLoginResponse = {
  accessToken: string;
  user: { id: string; email: string; name: string | null };
};

/**
 * The backend couldn't answer — it's down, or its database is unreachable.
 *
 * Kept separate from "wrong password" on purpose: reporting bad credentials for
 * a server outage sends people off resetting a password that was never wrong.
 * The backend answers 401 (and only 401) when the email/password is actually
 * incorrect, so anything else means the sign-in never got that far.
 */
class BackendUnavailable extends CredentialsSignin {
  code = "backend_unavailable";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Delegate to the NestJS backend.
        let res: Response;
        try {
          res = await fetch(`${BACKEND_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
            cache: "no-store",
          });
        } catch (err) {
          console.error("Auth: backend unreachable", err);
          throw new BackendUnavailable();
        }

        // 401 is the backend's answer for a wrong email or password.
        if (res.status === 401) return null;

        if (!res.ok) {
          console.error(`Auth: backend returned ${res.status} on login`);
          throw new BackendUnavailable();
        }

        const data: BackendLoginResponse = await res.json();
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name ?? "Admin",
          accessToken: data.accessToken,
        };
      },
    }),
  ],
  callbacks: {
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      if (path.startsWith("/login") || path.startsWith("/api/auth")) return true;
      return isLoggedIn;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token?.id) session.user.id = token.id as string;
      if (token?.accessToken) session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
