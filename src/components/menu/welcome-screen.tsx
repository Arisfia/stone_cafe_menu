"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CakeSlice,
  Coffee,
  Croissant,
  CupSoda,
  GlassWater,
  Martini,
  Moon,
  Pizza,
  Sun
} from "lucide-react";
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

  // Match the Stone Cafe logo green (#719567). Scoped to this subtree so the
  // shared Button / selectors recolor here without affecting /menu or /admin.
  const accentStyle = {
    "--primary": "107 22% 36%",
    "--primary-foreground": "0 0% 100%",
    "--ring": "107 22% 36%"
  } as CSSProperties;

  // Lock the page to a single, non-scrollable screen (prevents iOS Safari
  // rubber-band overscroll). Reverted on unmount so /menu can scroll normally.
  useEffect(() => {
    document.documentElement.classList.add("overflow-lock");
    document.body.classList.add("overflow-lock");
    return () => {
      document.documentElement.classList.remove("overflow-lock");
      document.body.classList.remove("overflow-lock");
    };
  }, []);

  return (
    <main
      dir={dir}
      style={accentStyle}
      className="fixed inset-0 flex touch-none items-center justify-center overflow-hidden overscroll-none bg-gradient-to-br from-[#eef3ec] via-[#e3eede] to-[#d5e3ce] p-4 dark:from-[#0d160c] dark:via-[#121d10] dark:to-[#0a120a]"
    >
      <CoffeeBackground />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-[#cdddc2]/70 bg-card/80 p-6 text-center shadow-2xl backdrop-blur-xl dark:border-[#2b3a25]/60 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#577249] dark:text-[#a3c497]">
          {translate(locale, "welcome.greeting")}
        </p>

        {/* Logo (placeholder steaming cup when no logo is set) */}
        <div className="mx-auto my-4 flex flex-col items-center gap-2">
          <div
            className={cn(
              "relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full shadow-lg ring-4",
              logoUrl
                ? "ring-white/70 dark:ring-white/10"
                : "bg-gradient-to-br from-amber-400 to-orange-600 ring-amber-200/50 dark:ring-amber-900/40"
            )}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={restaurantName}
                width={112}
                height={112}
                className="h-full w-full object-cover"
                priority
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

        {!logoUrl ? <h1 className="text-3xl font-bold text-foreground">{restaurantName}</h1> : null}
        <p className="text-sm text-muted-foreground">{translate(locale, "welcome.tagline")}</p>

        {/* Language */}
        <div className="mt-6 space-y-3">
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
  // Floating figures representing the cafe menu: coffee, mocktails, other
  // non-alcoholic drinks, cinnamon rolls, trileçe (tralicha), and mini pizza.
  const figures = [
    { Icon: Coffee, top: "11%", left: "9%", size: 30, delay: "0s", opacity: 0.16 },
    { Icon: Martini, top: "20%", left: "84%", size: 34, delay: "1.2s", opacity: 0.15 },
    { Icon: Pizza, top: "70%", left: "11%", size: 32, delay: "0.7s", opacity: 0.16 },
    { Icon: CakeSlice, top: "79%", left: "82%", size: 28, delay: "2s", opacity: 0.17 },
    { Icon: CupSoda, top: "43%", left: "91%", size: 26, delay: "1s", opacity: 0.15 },
    { Icon: Croissant, top: "85%", left: "46%", size: 30, delay: "0.4s", opacity: 0.14 },
    { Icon: GlassWater, top: "31%", left: "5%", size: 24, delay: "1.6s", opacity: 0.16 },
    { Icon: Coffee, top: "57%", left: "93%", size: 20, delay: "2.4s", opacity: 0.12 }
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* sage aroma blobs (+ a soft gold one echoing the logo's stone) */}
      <div className="aroma-pan absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#719567]/30 blur-3xl dark:bg-[#4e7341]/20" />
      <div
        className="aroma-pan absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#8cae80]/30 blur-3xl dark:bg-[#2f4a26]/25"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="aroma-pan absolute right-1/3 top-10 h-56 w-56 rounded-full bg-[#e3c14d]/20 blur-3xl dark:bg-[#6b5a1f]/15"
        style={{ animationDelay: "8s" }}
      />

      {/* floating menu figures */}
      {figures.map(({ Icon, ...figure }, index) => (
        <span
          key={index}
          className="bean-float absolute text-[#5f7d52] dark:text-[#9cbb90]"
          style={{ top: figure.top, left: figure.left, animationDelay: figure.delay, opacity: figure.opacity }}
        >
          <Icon style={{ width: figure.size, height: figure.size }} aria-hidden />
        </span>
      ))}
    </div>
  );
}
