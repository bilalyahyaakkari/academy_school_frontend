"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, RefreshCw, Server } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/**
 * Catches any unhandled error thrown from a server component in the (app)
 * route group and renders a friendly recovery card. The layout (sidebar +
 * top bar) stays mounted around it.
 *
 * Production builds replace server-component error messages with a generic
 * one (only `digest` survives), so we can't reliably tell "backend asleep"
 * from anything else here. By far the most common cause is the NestJS backend
 * waking up on Render's free tier (or Neon resuming), so the message always
 * says that, and offers a fresh sign-in in case the session is the problem.
 *
 * The root layout's LocaleProvider sits above this boundary, so useT() gets
 * the active locale; without one it falls back to English (the context
 * default), which is still a usable page.
 */
export default function AppGroupError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Next 16.2+: re-fetches the segment's server components, then re-renders. */
  unstable_retry?: () => void;
}) {
  const t = useT();

  // Log the full error to the console so it's still visible in dev.
  useEffect(() => {
    console.error("[app] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="relative w-full max-w-md overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-alert to-alert/60"
        />
        <CardContent className="relative space-y-4 pt-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-alert/10 text-alert">
            <Server className="size-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-sea-900">
              {t("error.title")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("error.desc")}</p>
            <p className="text-xs text-muted-foreground">
              {t("error.desc.session")}
            </p>
          </div>

          {/* Developer details: hidden by default but easy to glance at */}
          <details className="rounded-md border border-border bg-muted/30 px-3 py-2 text-start">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              {t("error.details")}
            </summary>
            <p
              dir="ltr"
              className="mt-2 break-words text-start font-mono text-[11px] text-muted-foreground"
            >
              {error.message}
              {error.digest && (
                <>
                  <br />
                  digest: {error.digest}
                </>
              )}
            </p>
          </details>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {/* `reset` alone only re-renders on the client, which can't fix
                a failed server fetch — retry re-fetches when available. */}
            <Button onClick={() => (unstable_retry ? unstable_retry() : reset())}>
              <RefreshCw className="size-4" />
              {t("error.retry")}
            </Button>
            <Button asChild variant="outline">
              {/* Route handler (signs out, then redirects to /login) — a
                  plain anchor, not a client-side navigation. */}
              <a href="/session-expired">
                <LogIn className="size-4 rtl:rotate-180" />
                {t("error.signInAgain")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
