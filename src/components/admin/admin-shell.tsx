"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  CircleUserRound,
  ExternalLink,
  KeyRound,
  ListTree,
  LogOut,
  Menu,
  MenuSquare,
  QrCode,
  Settings,
  UsersRound,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logoutAdmin } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils/cn";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { AdminPreferences, useAdminLocale } from "@/components/admin/admin-preferences";

const nav = [
  { href: "/admin/dashboard", labelKey: "dashboard", icon: BarChart3 },
  { href: "/admin/categories", labelKey: "categories", icon: ListTree },
  { href: "/admin/menu-items", labelKey: "menuItems", icon: MenuSquare },
  { href: "/admin/qr-code", labelKey: "qrCode", icon: QrCode },
  { href: "/admin/settings", labelKey: "settings", icon: Settings }
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAdminAuth();
  const { text, dir: textDir } = useAdminLocale();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isLogin = pathname === "/admin/login";

  if (isLogin) return <>{children}</>;

  if (!auth.isConfigured) {
    return (
      <main dir="ltr" className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-xl" dir="ltr">
          <CardContent className="space-y-4 pt-5">
            <AdminPreferences />
            <h1 dir={textDir} className="text-2xl font-semibold">
              {text.firebaseRequiredTitle}
            </h1>
            <p dir={textDir} className="text-muted-foreground">
              {text.firebaseRequiredDescription}
            </p>
            <Button asChild>
              <Link href="/menu">
                <span dir={textDir}>{text.viewPublicMenu}</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (auth.loading) {
    return (
      <main dir="ltr" className="flex min-h-screen items-center justify-center text-muted-foreground">
        <span dir={textDir}>{text.checkingSession}</span>
      </main>
    );
  }

  if (!auth.user || !auth.isAdmin) {
    router.replace("/admin/login");
    return (
      <main dir="ltr" className="flex min-h-screen items-center justify-center text-muted-foreground">
        <span dir={textDir}>{text.redirecting}</span>
      </main>
    );
  }

  async function handleLogout() {
    await logoutAdmin();
    router.replace("/admin/login");
  }

  return (
    <div dir="ltr" className="min-h-screen bg-background">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="no-print fixed left-3 top-3 z-40 rounded-full bg-card shadow-sm sm:hidden"
        aria-label="Open admin navigation"
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="h-4 w-4" aria-hidden />
      </Button>

      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 border-r bg-card p-4 sm:block">
        <AdminNavigation pathname={pathname} text={text} textDir={textDir} userEmail={auth.user.email || ""} onLogout={handleLogout} />
      </aside>

      <div
        className={cn(
          "no-print fixed inset-0 z-50 bg-background/70 backdrop-blur-sm transition-opacity sm:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!mobileNavOpen}
        onClick={() => setMobileNavOpen(false)}
      />

      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 w-64 border-r bg-card p-4 shadow-xl transition-transform duration-300 sm:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="absolute right-3 top-3 rounded-full"
          aria-label="Close admin navigation"
          onClick={() => setMobileNavOpen(false)}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
        <AdminNavigation
          pathname={pathname}
          text={text}
          textDir={textDir}
          userEmail={auth.user.email || ""}
          onNavigate={() => setMobileNavOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      <main className="pt-14 sm:ml-64 sm:pt-0">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}

function AdminNavigation({
  pathname,
  text,
  textDir,
  userEmail,
  onNavigate,
  onLogout
}: {
  pathname: string;
  text: Record<string, string>;
  textDir: "ltr" | "rtl";
  userEmail: string;
  onNavigate?: () => void;
  onLogout: () => void | Promise<void>;
}) {
  return (
    <div className="flex h-full flex-col">
      <Link href="/menu" dir={textDir} className="mb-6 block pr-10 text-xl font-semibold" onClick={onNavigate}>
        {text.brand}
      </Link>
      <nav className="grid gap-1">
        {nav.map((entry) => {
          const Icon = entry.icon;
          const label = text[entry.labelKey];
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              className={cn(
                "focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                pathname === entry.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span dir={textDir}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 rounded-md border p-3">
        <AdminPreferences />
      </div>
      <AdminProfileMenu text={text} textDir={textDir} userEmail={userEmail} onNavigate={onNavigate} onLogout={onLogout} />
    </div>
  );
}

function AdminProfileMenu({
  text,
  textDir,
  userEmail,
  onNavigate,
  onLogout
}: {
  text: Record<string, string>;
  textDir: "ltr" | "rtl";
  userEmail: string;
  onNavigate?: () => void;
  onLogout: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleNavigate() {
    setOpen(false);
    onNavigate?.();
  }

  async function handleLogoutClick() {
    setOpen(false);
    onNavigate?.();
    await onLogout();
  }

  return (
    <div ref={ref} className="relative mt-auto pt-4">
      {open ? (
        <div
          role="menu"
          className="pop-in absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-2xl border bg-card p-1.5 shadow-xl"
        >
          <div className="rounded-xl bg-muted/40 p-1">
            <ProfileMenuLink href="/admin/settings" icon={Settings} label={text.settings} textDir={textDir} onClick={handleNavigate} />
            <ProfileMenuLink
              href="/admin/settings#admin-password"
              icon={KeyRound}
              label={text.adminPassword}
              textDir={textDir}
              onClick={handleNavigate}
              nested
            />
          </div>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground opacity-70"
          >
            <UsersRound className="h-4 w-4 shrink-0" aria-hidden />
            <span dir={textDir} className="min-w-0 flex-1 text-start">
              {text.employeeSettings}
            </span>
            <span dir={textDir} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
              {text.comingSoon}
            </span>
          </button>
          <ProfileMenuLink href="/menu" icon={ExternalLink} label={text.viewPublicMenu} textDir={textDir} onClick={handleNavigate} />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogoutClick}
            className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span dir={textDir}>{text.logout}</span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="focus-ring flex w-full items-center gap-3 rounded-2xl border bg-background/60 p-2.5 text-start transition-colors hover:bg-muted"
        aria-label={text.adminProfile}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CircleUserRound className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span dir={textDir} className="block truncate text-sm font-semibold">
            {text.adminProfile}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{userEmail || text.email}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>
    </div>
  );
}

function ProfileMenuLink({
  href,
  icon: Icon,
  label,
  textDir,
  onClick,
  nested = false
}: {
  href: string;
  icon: typeof Settings;
  label: string;
  textDir: "ltr" | "rtl";
  onClick: () => void;
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={cn(
        "focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
        nested && "pl-9 text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0 text-primary", nested && "text-muted-foreground")} aria-hidden />
      <span dir={textDir}>{label}</span>
    </Link>
  );
}
