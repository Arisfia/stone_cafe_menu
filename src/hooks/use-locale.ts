"use client";

import { useEffect, useState } from "react";
import { dirForLocale, isLocale, type LocaleDirection } from "@/lib/i18n/config";
import type { Locale } from "@/types/models";

const localeStorageKey = "ary-menu-locale";
const localeChangeEvent = "ary-menu-locale-change";

type DocumentDirection = "locale" | LocaleDirection | false;

export function useLocale(defaultLocale: Locale = "ckb", options: { documentDirection?: DocumentDirection } = {}) {
  const documentDirection = options.documentDirection ?? "locale";
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(localeStorageKey);
    if (isLocale(stored)) setLocaleState(stored);

    function handleLocaleChange(event: Event) {
      const nextLocale = (event as CustomEvent<Locale>).detail;
      if (isLocale(nextLocale)) setLocaleState(nextLocale);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === localeStorageKey && isLocale(event.newValue)) {
        setLocaleState(event.newValue);
      }
    }

    window.addEventListener(localeChangeEvent, handleLocaleChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(localeChangeEvent, handleLocaleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (documentDirection) {
      document.documentElement.dir = documentDirection === "locale" ? dirForLocale(locale) : documentDirection;
    }
  }, [documentDirection, locale]);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);
    window.localStorage.setItem(localeStorageKey, nextLocale);
    window.dispatchEvent(new CustomEvent(localeChangeEvent, { detail: nextLocale }));
  }

  return { locale, setLocale, dir: dirForLocale(locale) };
}
