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

/** Reads the `exp` claim (seconds since epoch) from the backend's JWT. */
function tokenExpiry(accessToken: string | undefined): number | undefined {
  if (!accessToken) return undefined;
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString("utf8"),
    );
    return typeof payload.exp === "number" ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

/** Matches the backend's default JWT_EXPIRES_IN ("7d"). */
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export const { auth, handlers, signIn, signOut } = NextAuth({
  // The session can't outlive the backend token it wraps: once that token
  // expires every API call would 401 while the app still looks signed in.
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
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
        token.accessTokenExpires = tokenExpiry(token.accessToken as string | undefined);
      }
      // Backend token expired → end the session so the user is sent to /login
      // instead of every page failing with 401.
      const expires = token.accessTokenExpires as number | undefined;
      if (expires && Date.now() / 1000 >= expires - 60) {
        return null;
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
