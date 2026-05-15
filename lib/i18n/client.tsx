"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  translate,
  type Locale,
  type TranslationKey,
} from "./index";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Hook returning a translator bound to the current locale. */
export function useT() {
  const locale = useLocale();
  return useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );
}
