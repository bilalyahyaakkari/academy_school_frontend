// Next.js 16 renamed `middleware.ts` → `proxy.ts`. Runs on Node, not Edge.
import { auth } from "@/auth";

export default auth;

export const config = {
  // Match all paths except static assets, Next internals, and the auth API.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
