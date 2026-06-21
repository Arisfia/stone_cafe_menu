"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminAppData } from "@/lib/firebase/firestore";
import type { AppData } from "@/types/models";

export function DashboardStats() {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    getAdminAppData().then(setData);
  }, []);

  const categories = data?.categories || [];
  const items = data?.menuItems || [];
  const stats = [
    ["Total categories", categories.length],
    ["Active categories", categories.filter((entry) => entry.isActive).length],
    ["Total menu items", items.length],
    ["Available items", items.filter((entry) => entry.isAvailable && !entry.isSoldOut).length],
    ["Sold-out items", items.filter((entry) => entry.isSoldOut).length],
    ["Missing translations", items.filter((entry) => !entry.name.en || !entry.name.ar || !entry.name.ckb).length],
    ["Missing images", items.filter((entry) => !entry.imageUrl).length]
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Menu overview and quick actions.</p>
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
          <Link href="/admin/categories">Add Category</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/admin/menu-items">Add Menu Item</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/menu" target="_blank">View Public Menu</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/qr-code">Show QR Code</Link>
        </Button>
      </div>
    </div>
  );
}
