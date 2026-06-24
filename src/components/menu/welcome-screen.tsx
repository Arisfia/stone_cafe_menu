"use client";

import { useEffect, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CakeSlice,
  Coffee,
  Croissant,
  CupSoda,
  GlassWater,
  Martini,
  Pizza
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageGlobe } from "@/components/menu/language-globe";
import { ThemeToggle } from "@/components/menu/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { localized, translate } from "@/lib/i18n/config";
import { defaultAppData } from "@/data/default-data";
import { cn } from "@/lib/utils/cn";

export function WelcomeScreen() {
  const { locale, setLocale, dir: textDir } = useLocale("ckb", {
    documentDirection: "ltr",
    readStored: false
  });
  const restaurantName = localized(defaultAppData.general.restaurantName, locale);
  const logoUrl = defaultAppData.general.logoUrl;

  // Brand mint #A4D8A6 (HSL 122 40% 75%) as the accent. Deep-green foreground
  // keeps text legible on the light mint. Scoped to this subtree so the shared
  // Button / selectors recolor here without affecting /menu or /admin.
  const accentStyle = {
    "--primary": "122 40% 75%",
    "--primary-foreground": "128 44% 14%",
    "--ring": "122 40% 75%"
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
      dir="ltr"
      style={accentStyle}
      className="fixed inset-0 flex touch-none items-center justify-center overflow-hidden overscroll-none bg-gradient-to-br from-[#d7efd8] via-[#A4D8A6] to-[#86cc8a] p-4 dark:from-[#0c1810] dark:via-[#10210f] dark:to-[#0a140b]"
    >
      <CoffeeBackground />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-[#86cc8a]/60 bg-card/85 p-6 text-center shadow-2xl backdrop-blur-xl dark:border-[#2b3a25]/60 sm:p-8">
        {/* Fixed physical corner (right) so it doesn't move when the selected
            language flips the page direction. */}
        <ThemeToggle className="absolute right-4 top-4 z-20 h-11 w-11 border-[#86cc8a]/60 bg-background/70 shadow-sm backdrop-blur hover:bg-muted dark:border-[#2b3a25]/60" />

        <p dir={textDir} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7a3b] dark:text-[#A4D8A6]">
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
            <span dir={textDir} className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {translate(locale, "welcome.logoHint")}
            </span>
          ) : null}
        </div>

        {!logoUrl ? (
          <h1 dir={textDir} className="text-3xl font-bold text-foreground">
            {restaurantName}
          </h1>
        ) : null}
        <p dir={textDir} className="text-sm text-muted-foreground">
          {translate(locale, "welcome.tagline")}
        </p>

        {/* Language */}
        <div className="mt-6 space-y-3">
          <p dir={textDir} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {translate(locale, "welcome.chooseLanguage")}
          </p>
          {/* Globe symbol matches the admin + menu language switcher. */}
          <div className="flex justify-center" dir="ltr">
            <LanguageGlobe locale={locale} onChange={setLocale} />
          </div>
        </div>

        {/* Enter */}
        <Button asChild size="default" className="mt-8 h-12 w-full text-base font-semibold">
          <Link href="/menu">
            <span dir={textDir}>{translate(locale, "welcome.enter")}</span>
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </Button>
      </section>
    </main>
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
      {/* mint aroma blobs (+ a soft light glow) */}
      <div className="aroma-pan absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#A4D8A6]/45 blur-3xl dark:bg-[#A4D8A6]/15" />
      <div
        className="aroma-pan absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#c2ecc3]/50 blur-3xl dark:bg-[#2f4a26]/25"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="aroma-pan absolute right-1/3 top-10 h-56 w-56 rounded-full bg-white/35 blur-3xl dark:bg-[#3a5a33]/20"
        style={{ animationDelay: "8s" }}
      />

      {/* floating menu figures */}
      {figures.map(({ Icon, ...figure }, index) => (
        <span
          key={index}
          className="bean-float absolute text-[#3f8a49] dark:text-[#A4D8A6]"
          style={{ top: figure.top, left: figure.left, animationDelay: figure.delay, opacity: figure.opacity }}
        >
          <Icon style={{ width: figure.size, height: figure.size }} aria-hidden />
        </span>
      ))}
    </div>
  );
}
