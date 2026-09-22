import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { dirFor } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sakafa Academy — Admin",
  description: "Students, groups, attendance and monthly payments",
  // "Add to Home Screen" on iOS: launch without Safari's chrome and use the
  // short name under the icon. The icon itself comes from app/apple-icon.png.
  appleWebApp: {
    capable: true,
    title: "Sakafa",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#142473",
  // Keep the app out from under the iPhone's notch / home indicator when it
  // runs full-screen from the home screen.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dir = dirFor(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
