"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const themeStorageKey = "ary-menu-theme";
const themeChangeEvent = "ary-menu-theme-change";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    const nextDark = stored === "dark";
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);

    function applyTheme(nextTheme: string | null) {
      const isDark = nextTheme === "dark";
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    }

    function handleThemeChange(event: Event) {
      applyTheme((event as CustomEvent<string>).detail);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === themeStorageKey) applyTheme(event.newValue);
    }

    window.addEventListener(themeChangeEvent, handleThemeChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(themeChangeEvent, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const nextTheme = next ? "dark" : "light";
    window.localStorage.setItem(themeStorageKey, nextTheme);
    document.documentElement.classList.toggle("dark", next);
    window.dispatchEvent(new CustomEvent(themeChangeEvent, { detail: nextTheme }));
  }

  return (
    <Button type="button" variant="outline" size="icon" onClick={toggle} aria-label="Toggle theme">
      {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </Button>
  );
}
