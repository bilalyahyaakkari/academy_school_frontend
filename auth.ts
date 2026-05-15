import NextAuth from "next-auth";
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
        } catch {
          // Backend unreachable — surface as invalid credentials so we don't
          // leak infra state, but log so it shows up in the dev console.
          console.error("Auth: backend unreachable");
          return null;
        }

        if (!res.ok) return null;

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
