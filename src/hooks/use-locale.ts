"use client";

import { useEffect, useState } from "react";
import { dirForLocale, isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/types/models";

const localeStorageKey = "ary-menu-locale";
const localeChangeEvent = "ary-menu-locale-change";

export function useLocale(defaultLocale: Locale = "ckb") {
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
    document.documentElement.dir = dirForLocale(locale);
  }, [locale]);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);
    window.localStorage.setItem(localeStorageKey, nextLocale);
    window.dispatchEvent(new CustomEvent(localeChangeEvent, { detail: nextLocale }));
  }

  return { locale, setLocale, dir: dirForLocale(locale) };
}
