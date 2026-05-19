"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Server } from "lucide-react";

/**
 * Catches any unhandled error thrown from a server component in the (app)
 * route group and renders a friendly recovery card. The layout (sidebar +
 * top bar) stays mounted around it.
 *
 * Most common cause: the NestJS backend is sleeping (Render free tier) or
 * crashed because Neon Postgres was suspended. In that case the message is
 * "fetch failed" or "Internal server error".
 */
export default function AppGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the full error to the console so it's still visible in dev.
  useEffect(() => {
    console.error("[app] route error:", error);
  }, [error]);

  // Classify common transient cases so we can show a more helpful message.
  const message = error.message.toLowerCase();
  const isBackendDown =
    message.includes("fetch failed") || message.includes("econnrefused");
  const isBackendError =
    message.includes("internal server error") || message.includes("500");
  const isTransient = isBackendDown || isBackendError;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="relative w-full max-w-md overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
        />
        <CardContent className="relative space-y-4 pt-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
            {isTransient ? (
              <Server className="size-7" />
            ) : (
              <AlertTriangle className="size-7" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">
              {isBackendDown
                ? "Backend isn't reachable"
                : isBackendError
                  ? "Backend hiccup"
                  : "Something went wrong"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isBackendDown
                ? "The API server isn't responding. If it's the deployed backend, it may be waking up after idle — try again in 30 seconds."
                : isBackendError
                  ? "The API returned an error. The database may be waking from sleep — try again in a moment."
                  : "An unexpected error occurred. Try refreshing the page."}
            </p>
          </div>

          {/* Developer details: hidden by default but easy to glance at */}
          <details className="rounded-md border border-border bg-muted/30 px-3 py-2 text-start">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              Technical details
            </summary>
            <p className="mt-2 break-words font-mono text-[11px] text-muted-foreground">
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
            <Button onClick={reset}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
