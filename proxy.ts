// Next.js 16 renamed `middleware.ts` → `proxy.ts`. Runs on Node, not Edge.
import { auth } from "@/auth";

export default auth;

export const config = {
  // Match all paths except static assets, Next internals, and the auth API.
  //
  // `manifest.webmanifest` has to stay public: the browser fetches it before
  // anyone is signed in when the app is added to a phone's home screen, and a
  // redirect to /login there means no name, no icons, no standalone mode.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
