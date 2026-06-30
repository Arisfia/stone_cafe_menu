"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent, FileText, ListOrdered, Printer, Receipt, Scale, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminErrorText, useAdminLocale } from "@/components/admin/admin-preferences";
import { getPosState, listExpenses } from "@/lib/firebase/firestore";
import { localized } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Currency, Expense, Locale, PosCompletedOrder } from "@/types/models";

type Mode = "daily" | "monthly" | "all";

export function ReportsManager() {
  const { locale, text, dir: textDir } = useAdminLocale();
  const [orders, setOrders] = useState<PosCompletedOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("daily");
  const [day, setDay] = useState(() => todayKey());
  const [month, setMonth] = useState(() => todayKey().slice(0, 7));

  useEffect(() => {
    Promise.all([getPosState(), listExpenses()])
      .then(([state, nextExpenses]) => {
        setOrders(state.completedOrders || []);
        setExpenses(nextExpenses);
      })
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
        acc.subtotal += order.subtotal;
        acc.discount += order.discountAmount;
        acc.serviceFee += order.serviceFeeAmount || 0;
        acc.items += order.lines.reduce((sum, line) => sum + line.quantity, 0);
        return acc;
      },
      { revenue: 0, subtotal: 0, discount: 0, serviceFee: 0, items: 0 }
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

  // Expenses logged for the selected period (expense.date is already a local
  // YYYY-MM-DD key), and the resulting sale-after-expense figure.
  const expensesTotal = useMemo(() => {
    return expenses
      .filter((expense) => {
        if (mode === "all") return true;
        if (!expense.date) return false;
        return mode === "daily" ? expense.date === day : expense.date.slice(0, 7) === month;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, mode, day, month]);

  const saleAfterExpense = totals.revenue - expensesTotal;

  const periodLabel = mode === "all" ? text.allTime : mode === "monthly" ? formatMonthLabel(month, locale) : formatDayLabel(day, locale);

  function printSummary() {
    document.body.classList.add("report-printing");
    const cleanup = () => document.body.classList.remove("report-printing");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  }

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

      {/* Sales minus expenses = total sale after expense */}
      <Card className="overflow-hidden">
        <CardContent dir="ltr" className="flex flex-col items-stretch gap-3 p-5 sm:flex-row sm:items-center sm:gap-4">
          <SummaryFigure icon={<TrendingUp className="h-4 w-4" aria-hidden />} label={text.totalSales} value={formatMoney(totals.revenue, currency, locale)} tone="positive" textDir={textDir} />
          <Operator>−</Operator>
          <SummaryFigure icon={<TrendingDown className="h-4 w-4" aria-hidden />} label={text.totalExpenses} value={formatMoney(expensesTotal, currency, locale)} tone="negative" textDir={textDir} />
          <Operator>=</Operator>
          <SummaryFigure icon={<Scale className="h-4 w-4" aria-hidden />} label={text.saleAfterExpense} value={formatMoney(saleAfterExpense, currency, locale)} tone={saleAfterExpense >= 0 ? "positive" : "negative"} emphasized textDir={textDir} />
        </CardContent>
      </Card>

      {/* Close / shift summary — a printable end-of-period breakdown (Z-report style). */}
      <Card className="report-print-area">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" aria-hidden />
              {text.closeSummary}
            </CardTitle>
            <p dir={textDir} className="mt-1 text-xs text-muted-foreground">{periodLabel} · {filtered.length} {text.ordersCount}</p>
          </div>
          <Button variant="outline" size="sm" onClick={printSummary} className="shrink-0 print:hidden">
            <Printer className="me-1.5 h-4 w-4" aria-hidden />
            {text.printSummary}
          </Button>
        </CardHeader>
        <CardContent dir="ltr">
          <dl className="space-y-0.5 text-sm">
            <CloseLine label={text.grossSales} value={formatMoney(totals.subtotal, currency, locale)} textDir={textDir} />
            <CloseLine label={text.totalDiscounts} value={`− ${formatMoney(totals.discount, currency, locale)}`} tone="negative" textDir={textDir} />
            {totals.serviceFee > 0 ? (
              <CloseLine label={text.serviceFees} value={`+ ${formatMoney(totals.serviceFee, currency, locale)}`} textDir={textDir} />
            ) : null}
            <div className="my-1 border-t" />
            <CloseLine label={text.netSales} value={formatMoney(totals.revenue, currency, locale)} strong textDir={textDir} />
            <CloseLine label={text.totalExpenses} value={`− ${formatMoney(expensesTotal, currency, locale)}`} tone="negative" textDir={textDir} />
            <div className="my-1 border-t" />
            <CloseLine label={text.saleAfterExpense} value={formatMoney(saleAfterExpense, currency, locale)} tone={saleAfterExpense >= 0 ? "positive" : "negative"} emphasized textDir={textDir} />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">{totals.items} {text.itemsSold}</p>
        </CardContent>
      </Card>

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
            {text.allOrders}
            {filtered.length ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">{filtered.length}</span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length ? (
            <div className="space-y-2">
              {filtered.map((order) => (
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

function formatDayLabel(key: string, locale: Locale): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return new Date(y, m - 1, d).toLocaleDateString(locale === "ckb" ? "ar-IQ" : locale, { year: "numeric", month: "long", day: "numeric" });
}

function formatMonthLabel(key: string, locale: Locale): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString(locale === "ckb" ? "ar-IQ" : locale, { year: "numeric", month: "long" });
}

function CloseLine({
  label,
  value,
  tone,
  strong = false,
  emphasized = false,
  textDir
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
  strong?: boolean;
  emphasized?: boolean;
  textDir: "ltr" | "rtl";
}) {
  const accent = tone === "negative" ? "text-destructive" : tone === "positive" ? "text-primary" : "";
  return (
    <div className={cn("flex items-baseline justify-between gap-4 rounded-md px-1 py-1", emphasized && "bg-primary/5 px-2")}>
      <dt dir={textDir} className={cn("text-muted-foreground", (strong || emphasized) && "font-semibold text-foreground")}>{label}</dt>
      <dd className={cn("shrink-0 tabular-nums", accent, emphasized ? "text-lg font-bold" : strong ? "font-bold" : "font-medium")}>{value}</dd>
    </div>
  );
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

function SummaryFigure({
  icon,
  label,
  value,
  tone,
  emphasized = false,
  textDir
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "positive" | "negative";
  emphasized?: boolean;
  textDir: "ltr" | "rtl";
}) {
  const accent = tone === "negative" ? "text-destructive" : "text-primary";
  return (
    <div
      className={cn(
        "flex-1 rounded-xl border p-4",
        emphasized ? (tone === "negative" ? "border-destructive/40 bg-destructive/10" : "border-primary/40 bg-primary/10") : "bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone === "negative" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
          {icon}
        </span>
        <span dir={textDir} className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={cn("mt-2 font-bold tabular-nums", accent, emphasized ? "text-2xl sm:text-3xl" : "text-xl")}>{value}</p>
    </div>
  );
}

function Operator({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 select-none text-center text-xl font-bold text-muted-foreground sm:text-2xl" aria-hidden>
      {children}
    </span>
  );
}
