"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Coffee, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/menu/language-selector";
import { useLocale } from "@/hooks/use-locale";
import { localized, translate } from "@/lib/i18n/config";
import { defaultAppData } from "@/data/default-data";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/types/models";

const themeStorageKey = "ary-menu-theme";
const themeChangeEvent = "ary-menu-theme-change";

export function WelcomeScreen() {
  const { locale, setLocale, dir } = useLocale(defaultAppData.general.defaultLanguage);
  const restaurantName = localized(defaultAppData.general.restaurantName, locale);
  const logoUrl = defaultAppData.general.logoUrl;
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <main
      dir={dir}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 p-4 dark:from-stone-950 dark:via-[#1b140f] dark:to-stone-900"
    >
      <CoffeeBackground />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-amber-200/60 bg-card/80 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-amber-900/40">
        {/* Logo placeholder / steaming coffee */}
        <div className="mx-auto mb-6 flex flex-col items-center gap-2">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg ring-4 ring-amber-200/50 dark:ring-amber-900/40">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={restaurantName}
                width={112}
                height={112}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <SteamingCup />
            )}
          </div>
          {!logoUrl ? (
            <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {translate(locale, "welcome.logoHint")}
            </span>
          ) : null}
        </div>

        <p className="text-sm font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
          {translate(locale, "welcome.greeting")}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">{restaurantName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{translate(locale, "welcome.tagline")}</p>

        {/* Language */}
        <div className="mt-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {translate(locale, "welcome.chooseLanguage")}
          </p>
          <div className="flex justify-center">
            <LanguageSelector locale={locale} onChange={setLocale} />
          </div>
        </div>

        {/* Theme */}
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {translate(locale, "welcome.appearance")}
          </p>
          <ThemeSelector locale={locale} />
        </div>

        {/* Enter */}
        <Button asChild size="default" className="mt-8 h-12 w-full text-base font-semibold">
          <Link href="/menu">
            {translate(locale, "welcome.enter")}
            <Arrow className="h-5 w-5" aria-hidden />
          </Link>
        </Button>
      </section>
    </main>
  );
}

function ThemeSelector({ locale }: { locale: Locale }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    function apply(isDark: boolean) {
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    }
    apply(window.localStorage.getItem(themeStorageKey) === "dark");

    function handleThemeChange(event: Event) {
      apply((event as CustomEvent<string>).detail === "dark");
    }
    function handleStorage(event: StorageEvent) {
      if (event.key === themeStorageKey) apply(event.newValue === "dark");
    }
    window.addEventListener(themeChangeEvent, handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(themeChangeEvent, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function choose(isDark: boolean) {
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    const next = isDark ? "dark" : "light";
    window.localStorage.setItem(themeStorageKey, next);
    window.dispatchEvent(new CustomEvent(themeChangeEvent, { detail: next }));
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border bg-background p-1">
      <button
        type="button"
        onClick={() => choose(false)}
        aria-pressed={!dark}
        className={cn(
          "focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          !dark ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <Sun className="h-4 w-4" aria-hidden />
        {translate(locale, "welcome.light")}
      </button>
      <button
        type="button"
        onClick={() => choose(true)}
        aria-pressed={dark}
        className={cn(
          "focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          dark ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
        )}
      >
        <Moon className="h-4 w-4" aria-hidden />
        {translate(locale, "welcome.dark")}
      </button>
    </div>
  );
}

function SteamingCup() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-white cup-bob" aria-hidden focusable="false">
      {/* steam */}
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
        <path className="steam-wisp" style={{ animationDelay: "0s" }} d="M24 22 c-3.5 -4 3.5 -7 0 -11" />
        <path className="steam-wisp" style={{ animationDelay: "0.7s" }} d="M32 21 c-3.5 -4 3.5 -7 0 -11" />
        <path className="steam-wisp" style={{ animationDelay: "1.3s" }} d="M40 22 c-3.5 -4 3.5 -7 0 -11" />
      </g>
      {/* cup */}
      <path d="M14 28 H46 V35 A16 16 0 0 1 30 51 A16 16 0 0 1 14 35 Z" fill="currentColor" />
      {/* handle */}
      <path d="M46 31 a8 8 0 0 1 0 14" fill="none" stroke="currentColor" strokeWidth="4" />
      {/* coffee surface */}
      <ellipse cx="30" cy="28" rx="16" ry="3" fill="#6f4e37" />
      {/* saucer */}
      <ellipse cx="30" cy="54" rx="22" ry="3.4" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function CoffeeBackground() {
  const beans = [
    { top: "12%", left: "10%", size: 26, delay: "0s", opacity: 0.18 },
    { top: "22%", left: "82%", size: 34, delay: "1.4s", opacity: 0.14 },
    { top: "68%", left: "14%", size: 30, delay: "0.8s", opacity: 0.16 },
    { top: "78%", left: "78%", size: 22, delay: "2.1s", opacity: 0.2 },
    { top: "45%", left: "90%", size: 18, delay: "1.1s", opacity: 0.15 },
    { top: "85%", left: "44%", size: 24, delay: "0.4s", opacity: 0.12 }
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* warm aroma blobs */}
      <div className="aroma-pan absolute -left-24 -top-24 h-80 w-80 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-700/20" />
      <div
        className="aroma-pan absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-orange-300/30 blur-3xl dark:bg-orange-800/20"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="aroma-pan absolute right-1/3 top-10 h-56 w-56 rounded-full bg-rose-200/20 blur-3xl dark:bg-rose-900/10"
        style={{ animationDelay: "8s" }}
      />

      {/* floating coffee beans */}
      {beans.map((bean, index) => (
        <span
          key={index}
          className="bean-float absolute text-amber-800 dark:text-amber-500"
          style={{ top: bean.top, left: bean.left, animationDelay: bean.delay, opacity: bean.opacity }}
        >
          <Coffee style={{ width: bean.size, height: bean.size }} aria-hidden />
        </span>
      ))}
    </div>
  );
}
