"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ListTree, LogOut, MenuSquare, QrCode, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logoutAdmin } from "@/lib/firebase/auth";
import { cn } from "@/lib/utils/cn";
import { useAdminAuth } from "@/hooks/use-admin-auth";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/categories", label: "Categories", icon: ListTree },
  { href: "/admin/menu-items", label: "Menu Items", icon: MenuSquare },
  { href: "/admin/qr-code", label: "QR Code", icon: QrCode },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAdminAuth();
  const isLogin = pathname === "/admin/login";

  if (isLogin) return <>{children}</>;

  if (!auth.isConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-xl">
          <CardContent className="space-y-4 pt-5">
            <h1 className="text-2xl font-semibold">Firebase configuration required</h1>
            <p className="text-muted-foreground">
              Admin pages require Firebase Authentication and Firestore. Add the values in `.env.local`, create an approved
              /adminProfiles/uid document, then restart the dev server.
            </p>
            <Button asChild>
              <Link href="/menu">View public menu</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (auth.loading) {
    return <main className="flex min-h-screen items-center justify-center text-muted-foreground">Checking admin session...</main>;
  }

  if (!auth.user || !auth.isAdmin) {
    router.replace("/admin/login");
    return <main className="flex min-h-screen items-center justify-center text-muted-foreground">Redirecting...</main>;
  }

  async function handleLogout() {
    await logoutAdmin();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 start-0 hidden w-64 border-e bg-card p-4 lg:block">
        <Link href="/menu" className="mb-6 block text-xl font-semibold">
          Ary Menu Admin
        </Link>
        <nav className="grid gap-1">
          {nav.map((entry) => {
            const Icon = entry.icon;
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
                {entry.label}
              </Link>
            );
          })}
        </nav>
        <Button className="mt-6 w-full" variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden />
          Logout
        </Button>
      </aside>
      <header className="no-print sticky top-0 z-20 border-b bg-card lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto p-3">
          {nav.map((entry) => (
            <Button key={entry.href} asChild size="sm" variant={pathname === entry.href ? "default" : "outline"}>
              <Link href={entry.href}>{entry.label}</Link>
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="lg:ms-64">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
