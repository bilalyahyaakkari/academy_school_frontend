import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALES,
  translate,
  type Locale,
  type TranslationKey,
} from "./index";

export const LOCALE_COOKIE = "locale";

/** Reads the active locale from the cookie, defaulting to English. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

/** Returns a translator bound to the current request's locale. */
export async function getT() {
  const locale = await getLocale();
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}
