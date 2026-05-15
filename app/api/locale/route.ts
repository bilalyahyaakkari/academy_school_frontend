import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { LOCALES, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

/**
 * POST /api/locale { locale: "en" | "ar" }
 * Sets the locale cookie. The next page render uses the new value.
 */
export async function POST(req: NextRequest) {
  let body: { locale?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const locale = body.locale;
  if (!locale || !(LOCALES as readonly string[]).includes(locale)) {
    return new Response("Invalid locale", { status: 400 });
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale as Locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return new Response(null, { status: 204 });
}
