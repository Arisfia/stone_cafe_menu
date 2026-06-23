"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ListTree, LogOut, MenuSquare, QrCode, Settings } from "lucide-react";
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
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 border-r bg-card p-4 lg:block">
        <Link href="/menu" dir={textDir} className="mb-6 block text-xl font-semibold">
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
        <Button className="mt-6 w-full" variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden />
          <span dir={textDir}>{text.logout}</span>
        </Button>
      </aside>
      <header className="no-print sticky top-0 z-20 border-b bg-card lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto p-3">
          {nav.map((entry) => (
            <Button key={entry.href} asChild size="sm" variant={pathname === entry.href ? "default" : "outline"}>
              <Link href={entry.href}>
                <span dir={textDir}>{text[entry.labelKey]}</span>
              </Link>
            </Button>
          ))}
          <AdminPreferences compact />
          <Button size="sm" variant="outline" onClick={handleLogout}>
            <span dir={textDir}>{text.logout}</span>
          </Button>
        </div>
      </header>
      <main className="lg:ml-64">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
