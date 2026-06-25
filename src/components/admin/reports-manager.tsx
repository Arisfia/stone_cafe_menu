"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent, ListOrdered, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminErrorText, useAdminLocale } from "@/components/admin/admin-preferences";
import { getPosState } from "@/lib/firebase/firestore";
import { localized } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Currency, PosCompletedOrder } from "@/types/models";

type Mode = "daily" | "monthly" | "all";

export function ReportsManager() {
  const { locale, text, dir: textDir } = useAdminLocale();
  const [orders, setOrders] = useState<PosCompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("daily");
  const [day, setDay] = useState(() => todayKey());
  const [month, setMonth] = useState(() => todayKey().slice(0, 7));

  useEffect(() => {
    getPosState()
      .then((state) => setOrders(state.completedOrders || []))
      .catch((err) => setError(err instanceof Error ? err.message : text.settingsSaveFailed))
      .finally(() => setLoading(false));
  }, [text.settingsSaveFailed]);

  const filtered = useMemo(() => {
    return orders
      .filter((order) => {
        if (mode === "all") return true;
        const key = localDateKey(order.completedAt);
        if (!key) return false;
        return mode === "daily" ? key === day : key.slice(0, 7) === month;
      })
      .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  }, [orders, mode, day, month]);

  const currency: Currency = filtered[0]?.currency || orders[0]?.currency || "IQD";

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, order) => {
        acc.revenue += order.total;
        acc.discount += order.discountAmount;
        acc.items += order.lines.reduce((sum, line) => sum + line.quantity, 0);
        return acc;
      },
      { revenue: 0, discount: 0, items: 0 }
    );
  }, [filtered]);

  const topItems = useMemo(() => {
    const map = new Map<string, { name: PosCompletedOrder["lines"][number]["name"]; quantity: number; revenue: number }>();
    for (const order of filtered) {
      for (const line of order.lines) {
        const current = map.get(line.itemId) || { name: line.name, quantity: 0, revenue: 0 };
        current.quantity += line.quantity;
        current.revenue += line.quantity * line.unitPrice;
        map.set(line.itemId, current);
      }
    }
    return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  }, [filtered]);

  const avgOrder = filtered.length ? Math.round(totals.revenue / filtered.length) : 0;

  const modes: { key: Mode; label: string }[] = [
    { key: "daily", label: text.daily },
    { key: "monthly", label: text.monthly },
    { key: "all", label: text.allTime }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{text.reports}</h1>
          <p dir={textDir} className="text-muted-foreground">{text.reportsDesc}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {modes.map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setMode(entry.key)}
                className={cn(
                  "focus-ring rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === entry.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>
          {mode === "daily" ? (
            <Input type="date" value={day} max={todayKey()} onChange={(event) => setDay(event.target.value)} className="h-9 w-auto" aria-label={text.daily} />
          ) : null}
          {mode === "monthly" ? (
            <Input type="month" value={month} max={todayKey().slice(0, 7)} onChange={(event) => setMonth(event.target.value)} className="h-9 w-auto" aria-label={text.monthly} />
          ) : null}
        </div>
      </div>

      {error ? <p dir={textDir} className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{adminErrorText(error, text)}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<TrendingUp className="h-5 w-5" aria-hidden />} label={text.totalRevenue} value={formatMoney(totals.revenue, currency, locale)} />
        <StatCard icon={<Receipt className="h-5 w-5" aria-hidden />} label={text.ordersCount} value={String(filtered.length)} />
        <StatCard icon={<ShoppingBag className="h-5 w-5" aria-hidden />} label={text.itemsSold} value={String(totals.items)} />
        <StatCard icon={<BadgePercent className="h-5 w-5" aria-hidden />} label={text.totalDiscounts} value={formatMoney(totals.discount, currency, locale)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard icon={<TrendingUp className="h-5 w-5" aria-hidden />} label={text.avgOrder} value={formatMoney(avgOrder, currency, locale)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="h-5 w-5 text-primary" aria-hidden />
            {text.topItems}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{text.checkingSession}</p>
          ) : topItems.length ? (
            <div className="space-y-2">
              {topItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                  <span dir={textDir} className="min-w-0 flex-1 truncate text-sm font-medium">{localized(item.name, locale)}</span>
                  <span className="shrink-0 text-sm font-semibold">{item.quantity}×</span>
                  <span className="shrink-0 text-sm text-muted-foreground">{formatMoney(item.revenue, currency, locale)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p dir={textDir} className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text.noSales}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" aria-hidden />
            {text.recentOrders}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length ? (
            <div className="space-y-2">
              {filtered.slice(0, 15).map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                  <div className="min-w-0">
                    <p dir={textDir} className="truncate text-sm font-medium">{order.tableName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.completedAt).toLocaleString(locale === "ckb" ? "ar-IQ" : locale)} ·{" "}
                      {order.lines.reduce((sum, line) => sum + line.quantity, 0)} {text.itemsSold}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{formatMoney(order.total, order.currency, locale)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p dir={textDir} className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text.noSales}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Local-time YYYY-MM-DD so a day/month picked in the admin's timezone matches.
function localDateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayKey(): string {
  return localDateKey(new Date().toISOString());
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
        <span className="min-w-0">
          <span className="block truncate text-xs text-muted-foreground">{label}</span>
          <span className="block truncate text-xl font-bold">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}
