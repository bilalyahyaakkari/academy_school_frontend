import { AppShell } from "@/components/app/app-shell";
import { requireSession } from "@/lib/auth-helpers";
import { settingsApi } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  let academyName = "Academy";
  try {
    const settings = await settingsApi.get();
    academyName = settings.academyName;
  } catch (err) {
    if (!(err instanceof ApiError)) console.error("settings fetch failed", err);
  }

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-background via-background to-primary/[0.04]">
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
