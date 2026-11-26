import { AppShell } from "@/components/app/app-shell";
import { requireSession } from "@/lib/auth-helpers";
import { settingsApi } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  let academyName = "Academy";
  let expired = false;
  try {
    const settings = await settingsApi.get();
    academyName = settings.academyName;
  } catch (err) {
    // The backend no longer accepts our token (expired / secret rotated):
    // sign out cleanly instead of rendering a shell where every call fails.
    if (err instanceof ApiError && err.status === 401) expired = true;
    else if (!(err instanceof ApiError)) console.error("settings fetch failed", err);
  }
  if (expired) redirect("/session-expired");

  return (
    <div className="relative flex min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <AppShell
        academyName={academyName}
        userName={session.user.name ?? session.user.email ?? "Admin"}
      >
        {children}
      </AppShell>
    </div>
  );
}
