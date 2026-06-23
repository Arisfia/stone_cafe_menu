"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe2 } from "lucide-react";
import { dirForLocale, localeLabels, locales } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/types/models";

export function LanguageGlobe({
  locale,
  onChange,
  menuAlign = "right"
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
  menuAlign?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} dir="ltr" className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Select language"
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-full border bg-card text-primary shadow-sm transition-colors hover:bg-muted"
      >
        <Globe2 className="globe-spin h-5 w-5" aria-hidden />
        {/* Accent dot orbiting the globe */}
        <span className="globe-orbit pointer-events-none absolute inset-1.5" aria-hidden>
          <span className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary shadow-sm" />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "pop-in absolute top-full z-30 mt-2 min-w-[9rem] overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl",
            menuAlign === "left" ? "left-0" : "right-0"
          )}
        >
          {locales.map((entry) => {
            const active = entry === locale;
            return (
              <button
                key={entry}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(entry);
                  setOpen(false);
                }}
                className={cn(
                  "focus-ring flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <span dir={dirForLocale(entry)}>{localeLabels[entry]}</span>
                {active ? <Check className="h-4 w-4" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
