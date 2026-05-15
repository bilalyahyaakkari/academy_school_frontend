"use client";

import { useRef, useState, useTransition } from "react";
import { changePasswordAction } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function SecuritySection() {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await changePasswordAction(formData);
      if (res.success) {
        toast.success(t("settings.security.toast.saved"));
        formRef.current?.reset();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-44 animate-drift-3 rounded-full bg-fuchsia-400/20 blur-3xl"
      />
      <CardContent className="relative pt-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-md">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {t("settings.security.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings.security.desc")}
            </p>
          </div>
        </div>

        <form ref={formRef} action={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="currentPassword">
              {t("settings.security.current")}
            </Label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              show={showCurrent}
              onToggle={() => setShowCurrent((s) => !s)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("settings.security.new")}</Label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              minLength={6}
              show={showNew}
              onToggle={() => setShowNew((s) => !s)}
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.security.new.help")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("settings.security.confirm")}
            </Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              minLength={6}
              show={showNew}
              onToggle={() => setShowNew((s) => !s)}
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("settings.security.submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordInput({
  show,
  onToggle,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input {...rest} type={show ? "text" : "password"} required className="pe-10" />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute end-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
