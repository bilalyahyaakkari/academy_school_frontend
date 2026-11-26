"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster(props: React.ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Palette-only status toasts (instead of sonner's richColors, which
          // would bring in green / yellow / blue). Red stays for errors.
          success: "border-sea-300! [&_[data-icon]]:text-sea-700",
          info: "[&_[data-icon]]:text-sea-800",
          warning: "border-sea-300! bg-sea-100! text-sea-900! [&_[data-icon]]:text-sea-800",
          error: "border-alert/40! [&_[data-icon]]:text-alert",
        },
      }}
      {...props}
    />
  );
}
