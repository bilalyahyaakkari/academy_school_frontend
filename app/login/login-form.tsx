"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAction, type SignInErrorCode } from "./actions";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowRight, Mail, Lock } from "lucide-react";

/**
 * Only follow callbackUrl when it points back into this app — otherwise a link
 * like /login?callbackUrl=https://evil.example would send the admin off-site
 * right after signing in.
 */
function safeCallbackUrl(raw: string | null): string {
  if (!raw) return "/dashboard";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/dashboard";
    if (url.pathname.startsWith("/login")) return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

const ERROR_KEYS: Record<SignInErrorCode, TranslationKey> = {
  backend_unavailable: "login.error.backend",
  invalid: "login.error.invalid",
  generic: "login.error.generic",
};

export function LoginForm() {
  const t = useT();
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // onSubmit (not <form action>): React 19 resets an action form's fields even
  // when sign-in fails, which would wipe the email the admin just typed.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await signInAction(formData);
      if (res?.error) {
        const message = t(ERROR_KEYS[res.error] ?? "login.error.generic");
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(t("login.toast.welcome"));
      router.push(safeCallbackUrl(search.get("callbackUrl")));
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">{t("login.email")}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@academy.local"
            className="h-11 ps-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("login.password")}</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 ps-9"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="h-11 w-full gap-2" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {t("login.submit")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </>
        )}
      </Button>
    </form>
  );
}
