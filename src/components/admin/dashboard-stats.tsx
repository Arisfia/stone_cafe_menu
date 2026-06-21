"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminLocale } from "@/components/admin/admin-preferences";
import { getAdminAppData } from "@/lib/firebase/firestore";
import type { AppData } from "@/types/models";

export function DashboardStats() {
  const { text } = useAdminLocale();
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    getAdminAppData().then(setData);
  }, []);

  const categories = data?.categories || [];
  const items = data?.menuItems || [];
  const stats = [
    [text.totalCategories, categories.length],
    [text.activeCategories, categories.filter((entry) => entry.isActive).length],
    [text.totalMenuItems, items.length],
    [text.availableItems, items.filter((entry) => entry.isAvailable && !entry.isSoldOut).length],
    [text.soldOutItems, items.filter((entry) => entry.isSoldOut).length],
    [text.missingTranslations, items.filter((entry) => !entry.name.en || !entry.name.ar || !entry.name.ckb).length],
    [text.missingImages, items.filter((entry) => !entry.imageUrl).length]
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{text.dashboard}</h1>
        <p className="text-muted-foreground">{text.dashboardDescription}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/categories">{text.addCategory}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/admin/menu-items">{text.addMenuItem}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/menu" target="_blank">{text.viewPublicMenu}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/qr-code">{text.showQrCode}</Link>
        </Button>
      </div>
    </div>
  );
}
