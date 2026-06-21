"use client";

import { useEffect, useState } from "react";
import { dirForLocale, isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/types/models";

export function useLocale(defaultLocale: Locale = "ckb") {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem("ary-menu-locale");
    if (isLocale(stored)) setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirForLocale(locale);
  }, [locale]);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);
    window.localStorage.setItem("ary-menu-locale", nextLocale);
  }

  return { locale, setLocale, dir: dirForLocale(locale) };
}
