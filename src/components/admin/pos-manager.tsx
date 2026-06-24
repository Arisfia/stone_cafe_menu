"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Minus,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Table2,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminErrorText, useAdminLocale } from "@/components/admin/admin-preferences";
import { getAdminAppData, getPosState, savePosState } from "@/lib/firebase/firestore";
import { localized } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatMoney, normalizeSearch } from "@/lib/utils/format";
import type { AppData, Currency, MenuItem, PosCompletedOrder, PosDiscountType, PosState, PosTable, PosTableOrder } from "@/types/models";

const emptyPosState: PosState = {
  tables: [],
  orders: {},
  completedOrders: []
};

export function PosManager() {
  const { locale, text, dir: textDir } = useAdminLocale();
  const [data, setData] = useState<AppData | null>(null);
  const [pos, setPos] = useState<PosState>(emptyPosState);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [tableNameDraft, setTableNameDraft] = useState("");
  const [draftTables, setDraftTables] = useState<PosTable[]>([]);
  const [draftOrders, setDraftOrders] = useState<PosState["orders"]>({});
  const [draftSelectedTableId, setDraftSelectedTableId] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tableToolsOpen, setTableToolsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getAdminAppData(), getPosState()])
      .then(([appData, posState]) => {
        const nextPos = normalizeTableOrder(posState);
        setData(appData);
        setPos(nextPos);
        setSelectedTableId(nextPos.tables[0]?.id || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : text.settingsSaveFailed));
  }, [text.settingsSaveFailed]);

  const tables = useMemo(() => [...pos.tables].sort((a, b) => a.displayOrder - b.displayOrder), [pos.tables]);
  const selectedTable = tables.find((table) => table.id === selectedTableId) || tables[0];
  const selectedOrder = selectedTable ? pos.orders[selectedTable.id] || emptyOrder(selectedTable.id) : null;
  const categories = useMemo(
    () => (data?.categories || []).filter((category) => category.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
    [data?.categories]
  );
  const menuItems = useMemo(() => {
    const normalized = normalizeSearch(query);
    return (data?.menuItems || [])
      .filter((item) => item.isAvailable && !item.isSoldOut)
      .filter((item) => categoryFilter === "all" || item.categoryId === categoryFilter)
      .filter((item) => {
        if (!normalized) return true;
        const category = data?.categories.find((entry) => entry.id === item.categoryId);
        return [
          ...Object.values(item.name),
          ...Object.values(item.description || {}),
          category ? localized(category.name, locale, category.name.en) : ""
        ]
          .map(normalizeSearch)
          .join(" ")
          .includes(normalized);
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categoryFilter, data?.categories, data?.menuItems, locale, query]);

  useEffect(() => {
    if (tableToolsOpen) return;
    if (!selectedTable && tables[0]) {
      setSelectedTableId(tables[0].id);
      return;
    }
    setTableNameDraft(selectedTable?.name || "");
  }, [selectedTable, tables, tableToolsOpen]);

  async function persist(nextPos: PosState, nextMessage?: string) {
    const previousPos = pos;
    setPos(nextPos);
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await savePosState(nextPos);
      if (nextMessage) setMessage(nextMessage);
      return true;
    } catch (err) {
      setPos(previousPos);
      setError(err instanceof Error ? err.message : text.settingsSaveFailed);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function openTableTools() {
    const nextDraftTables = tables.map((table) => ({ ...table }));
    setDraftTables(nextDraftTables);
    setDraftOrders({ ...pos.orders });
    setDraftSelectedTableId(selectedTable?.id || nextDraftTables[0]?.id || "");
    setTableNameDraft(selectedTable?.name || nextDraftTables[0]?.name || "");
    setMessage("");
    setError("");
    setTableToolsOpen(true);
  }

  function closeTableTools() {
    setDraftTables([]);
    setDraftOrders({});
    setDraftSelectedTableId("");
    setTableNameDraft(selectedTable?.name || "");
    setTableToolsOpen(false);
  }

  function selectDraftTable(tableId: string) {
    const table = draftTables.find((entry) => entry.id === tableId);
    setDraftSelectedTableId(tableId);
    setTableNameDraft(table?.name || "");
  }

  function renameDraftTable(name: string) {
    setTableNameDraft(name);
    setDraftTables((current) => current.map((table) => table.id === draftSelectedTableId ? { ...table, name } : table));
  }

  function addDraftTable() {
    const nextNumber = draftTables.length + 1;
    const table: PosTable = {
      id: crypto.randomUUID(),
      name: `${text.table} ${nextNumber}`,
      displayOrder: draftTables.length,
      isActive: true
    };
    setDraftTables((current) => normalizeTableOrder({ ...pos, tables: [...current, table] }).tables);
    setDraftOrders((current) => ({ ...current, [table.id]: emptyOrder(table.id) }));
    setDraftSelectedTableId(table.id);
    setTableNameDraft(table.name);
  }

  function removeDraftTable() {
    if (!draftSelectedTableId || draftTables.length <= 1) return;
    const nextTables = normalizeTableOrder({
      ...pos,
      tables: draftTables.filter((table) => table.id !== draftSelectedTableId)
    }).tables;
    const nextOrders = { ...draftOrders };
    delete nextOrders[draftSelectedTableId];
    const nextSelectedId = nextTables[0]?.id || "";
    setDraftTables(nextTables);
    setDraftOrders(nextOrders);
    setDraftSelectedTableId(nextSelectedId);
    setTableNameDraft(nextTables[0]?.name || "");
  }

  async function saveTableChanges() {
    const nextTables = normalizeTableOrder({
      ...pos,
      tables: draftTables
        .filter((table) => table.name.trim())
        .map((table) => ({ ...table, name: table.name.trim() }))
    }).tables;
    if (!nextTables.length) return;

    const tableIds = new Set(nextTables.map((table) => table.id));
    const nextOrders = Object.fromEntries(Object.entries(pos.orders).filter(([tableId]) => tableIds.has(tableId)));
    for (const table of nextTables) {
      if (!nextOrders[table.id]) nextOrders[table.id] = draftOrders[table.id] || emptyOrder(table.id);
    }

    const nextSelectedTableId = tableIds.has(selectedTableId) ? selectedTableId : nextTables[0]?.id || "";
    const saved = await persist({ ...pos, tables: nextTables, orders: nextOrders }, text.tableSaved);
    if (saved) {
      setSelectedTableId(nextSelectedTableId);
      closeTableTools();
    }
  }

  function updateOrder(updater: (order: PosTableOrder) => PosTableOrder) {
    if (!selectedTable) return;
    const current = pos.orders[selectedTable.id] || emptyOrder(selectedTable.id);
    const nextOrder = {
      ...updater(current),
      tableId: selectedTable.id,
      updatedAt: new Date().toISOString()
    };
    void persist({
      ...pos,
      orders: {
        ...pos.orders,
        [selectedTable.id]: nextOrder
      }
    });
  }

  function addMenuItem(item: MenuItem) {
    const price = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.basePrice;
    updateOrder((order) => {
      const existing = order.lines.find((line) => line.itemId === item.id && line.unitPrice === price);
      const lines = existing
        ? order.lines.map((line) => line.id === existing.id ? { ...line, quantity: line.quantity + 1 } : line)
        : [
            ...order.lines,
            {
              id: crypto.randomUUID(),
              itemId: item.id,
              name: item.name,
              quantity: 1,
              unitPrice: price,
              currency: item.currency
            }
          ];
      return { ...order, lines };
    });
  }

  function changeLineQuantity(lineId: string, delta: number) {
    updateOrder((order) => ({
      ...order,
      lines: order.lines
        .map((line) => line.id === lineId ? { ...line, quantity: line.quantity + delta } : line)
        .filter((line) => line.quantity > 0)
    }));
  }

  function removeLine(lineId: string) {
    updateOrder((order) => ({
      ...order,
      lines: order.lines.filter((line) => line.id !== lineId)
    }));
  }

  function setDiscountType(discountType: PosDiscountType) {
    updateOrder((order) => ({ ...order, discountType }));
  }

  function setDiscountValue(discountValue: number) {
    updateOrder((order) => ({ ...order, discountValue: Math.max(0, discountValue || 0) }));
  }

  function completeOrder() {
    if (!selectedTable || !selectedOrder || !selectedOrder.lines.length || !totals) return;
    const completedOrder: PosCompletedOrder = {
      id: crypto.randomUUID(),
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      lines: selectedOrder.lines,
      discountType: selectedOrder.discountType,
      discountValue: selectedOrder.discountValue,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      total: totals.total,
      currency: totals.currency,
      completedAt: new Date().toISOString()
    };

    void persist({
      ...pos,
      completedOrders: [...(pos.completedOrders || []), completedOrder],
      orders: {
        ...pos.orders,
        [selectedTable.id]: emptyOrder(selectedTable.id)
      }
    }, text.orderCompleted);
  }

  function printInvoice() {
    document.body.classList.add("pos-printing");
    const cleanup = () => document.body.classList.remove("pos-printing");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  }

  const totals = selectedOrder ? calculateTotals(selectedOrder, data?.general.defaultCurrency || "IQD") : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{text.pos}</h1>
          <p className="text-muted-foreground">{text.posDescription}</p>
        </div>
        {saving ? <span className="rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground">{text.saving}</span> : null}
      </div>

      {message ? <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{adminErrorText(error, text)}</p> : null}

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Table2 className="h-5 w-5 text-primary" aria-hidden />
              {text.tables}
            </CardTitle>
            <Button
              type="button"
              variant={tableToolsOpen ? "default" : "outline"}
              size="icon"
              aria-label={text.editTable}
              title={text.editTable}
              onClick={() => tableToolsOpen ? closeTableTools() : openTableTools()}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          {!tableToolsOpen ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
              {tables.map((table) => {
                const order = pos.orders[table.id];
                const count = order?.lines.reduce((sum, line) => sum + line.quantity, 0) || 0;
                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => setSelectedTableId(table.id)}
                    className={cn(
                      "focus-ring min-h-20 rounded-lg border p-3 text-start transition-colors",
                      table.id === selectedTable?.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card hover:bg-muted"
                    )}
                  >
                    <span dir={textDir} className="block truncate text-base font-semibold">{table.name}</span>
                    <span dir={textDir} className={cn("mt-2 block truncate text-xs", table.id === selectedTable?.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {count ? `${count} ${text.menuItems}` : text.noItemsOnTable}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {tableToolsOpen ? (
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2">
                {draftTables.map((table) => {
                  const order = draftOrders[table.id];
                  const count = order?.lines.reduce((sum, line) => sum + line.quantity, 0) || 0;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => selectDraftTable(table.id)}
                      className={cn(
                        "focus-ring min-h-16 rounded-lg border p-2 text-start transition-colors",
                        table.id === draftSelectedTableId ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card hover:bg-muted"
                      )}
                    >
                      <span dir={textDir} className="block truncate text-sm font-semibold">{table.name}</span>
                      <span dir={textDir} className={cn("mt-1 block truncate text-xs", table.id === draftSelectedTableId ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {count ? `${count} ${text.menuItems}` : text.noItemsOnTable}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Field label={text.tableName}>
                <Input value={tableNameDraft} onChange={(event) => renameDraftTable(event.target.value)} disabled={!draftSelectedTableId} />
              </Field>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                <Button type="button" variant="outline" onClick={addDraftTable}>
                  <Plus className="h-4 w-4" aria-hidden />
                  {text.addTable}
                </Button>
                <Button type="button" variant="outline" onClick={() => void saveTableChanges()} disabled={!draftTables.length}>
                  {text.saveTable}
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={text.cancel} title={text.cancel} onClick={closeTableTools}>
                  <X className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label={text.removeTable}
                  title={text.removeTable}
                  onClick={removeDraftTable}
                  disabled={!draftSelectedTableId || draftTables.length <= 1}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle className="text-lg">{text.menuPicker}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p dir={textDir} className="text-sm text-muted-foreground">{text.tapItemsToAdd}</p>
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input className="ps-10" dir={textDir} placeholder={text.searchItems} value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">{text.allCategories}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{localized(category.name, locale, category.name.en)}</option>
                ))}
              </Select>
            </div>
            <div className="max-h-[640px] overflow-y-auto pr-1 xl:max-h-[calc(100vh-21rem)]">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {menuItems.map((item) => {
                  const title = localized(item.name, locale, item.name.en);
                  const price = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.basePrice;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addMenuItem(item)}
                      className="focus-ring flex min-h-24 items-start justify-between gap-3 rounded-lg border bg-card p-3 text-start transition-colors hover:border-primary/40 hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span dir={textDir} className="line-clamp-2 block font-semibold">{title}</span>
                        <span dir={textDir} className="mt-1 line-clamp-1 block text-xs text-muted-foreground">
                          {localized(data?.categories.find((category) => category.id === item.categoryId)?.name, locale, text.noCategory)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {formatMoney(price, item.currency, locale)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ReceiptText className="h-5 w-5 text-primary" aria-hidden />
              {text.orderSummary}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTable && selectedOrder && totals ? (
              <>
                <div className="rounded-lg border bg-muted/25 p-3">
                  <p dir={textDir} className="font-semibold">{selectedTable.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date().toLocaleString(locale === "ckb" ? "ar-IQ" : locale)}</p>
                </div>

                <div className="space-y-2">
                  {selectedOrder.lines.length ? selectedOrder.lines.map((line) => (
                    <div key={line.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
                        <p dir={textDir} className="line-clamp-2 text-sm font-semibold">{localized(line.name, locale)}</p>
                        <p className="text-xs text-muted-foreground">{formatMoney(line.unitPrice, line.currency, locale)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" aria-label="Decrease" onClick={() => changeLineQuantity(line.id, -1)}>
                          <Minus className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                        <Button type="button" variant="outline" size="icon" aria-label="Increase" onClick={() => changeLineQuantity(line.id, 1)}>
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        <Button type="button" variant="destructive" size="icon" aria-label={text.remove} onClick={() => removeLine(line.id)}>
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p dir={textDir} className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">{text.noItemsOnTable}</p>
                  )}
                </div>

                <div className="grid gap-3 rounded-lg border p-3">
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <Select value={selectedOrder.discountType} onChange={(event) => setDiscountType(event.target.value as PosDiscountType)}>
                      <option value="amount">{text.amountDiscount}</option>
                      <option value="percent">{text.percentDiscount}</option>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      max={selectedOrder.discountType === "percent" ? 100 : undefined}
                      value={selectedOrder.discountValue}
                      onChange={(event) => setDiscountValue(Number(event.target.value))}
                    />
                  </div>
                  <TotalRow label={text.subtotal} value={formatMoney(totals.subtotal, totals.currency, locale)} />
                  <TotalRow label={text.discount} value={`-${formatMoney(totals.discountAmount, totals.currency, locale)}`} />
                  <TotalRow label={text.total} value={formatMoney(totals.total, totals.currency, locale)} strong />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" onClick={completeOrder} disabled={!selectedOrder.lines.length}>
                    {text.completeOrder}
                  </Button>
                  <Button type="button" onClick={printInvoice} disabled={!selectedOrder.lines.length}>
                    <Printer className="h-4 w-4" aria-hidden />
                    {text.printInvoice}
                  </Button>
                </div>

                <ReceiptPreview
                  restaurantName={localized(data?.general.restaurantName, locale, "Stone Cafe")}
                  table={selectedTable}
                  order={selectedOrder}
                  totals={totals}
                  locale={locale}
                  text={text}
                  textDir={textDir}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 text-sm", strong && "border-t pt-3 text-lg font-bold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ReceiptPreview({
  restaurantName,
  table,
  order,
  totals,
  locale,
  text,
  textDir
}: {
  restaurantName: string;
  table: PosTable;
  order: PosTableOrder;
  totals: PosTotals;
  locale: "en" | "ar" | "ckb";
  text: Record<string, string>;
  textDir: "ltr" | "rtl";
}) {
  return (
    <div className="pos-print-area rounded-lg border bg-white p-4 text-black shadow-sm">
      <div className="text-center">
        <h2 className="text-lg font-bold">{restaurantName}</h2>
        <p dir={textDir} className="text-xs">{text.receipt} · {table.name}</p>
        <p className="text-[11px]">{new Date().toLocaleString(locale === "ckb" ? "ar-IQ" : locale)}</p>
      </div>
      <div className="my-3 border-t border-dashed border-black" />
      <div className="space-y-2">
        {order.lines.map((line) => (
          <div key={line.id} className="grid grid-cols-[1fr_auto] gap-2 text-xs">
            <div className="min-w-0">
              <p dir={textDir} className="font-bold">{localized(line.name, locale)}</p>
              <p>{line.quantity} x {formatMoney(line.unitPrice, line.currency, locale)}</p>
            </div>
            <p className="font-bold">{formatMoney(line.quantity * line.unitPrice, line.currency, locale)}</p>
          </div>
        ))}
      </div>
      <div className="my-3 border-t border-dashed border-black" />
      <div className="space-y-1 text-xs">
        <TotalRow label={text.subtotal} value={formatMoney(totals.subtotal, totals.currency, locale)} />
        <TotalRow label={text.discount} value={`-${formatMoney(totals.discountAmount, totals.currency, locale)}`} />
        <TotalRow label={text.total} value={formatMoney(totals.total, totals.currency, locale)} strong />
      </div>
    </div>
  );
}

type PosTotals = {
  subtotal: number;
  discountAmount: number;
  total: number;
  currency: Currency;
};

function emptyOrder(tableId: string): PosTableOrder {
  return {
    tableId,
    lines: [],
    discountType: "amount",
    discountValue: 0
  };
}

function calculateTotals(order: PosTableOrder, fallbackCurrency: Currency): PosTotals {
  const currency = order.lines[0]?.currency || fallbackCurrency;
  const subtotal = order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const rawDiscount = order.discountType === "percent"
    ? Math.round(subtotal * Math.min(order.discountValue, 100) / 100)
    : order.discountValue;
  const discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));
  return {
    subtotal,
    discountAmount,
    total: subtotal - discountAmount,
    currency
  };
}

function normalizeTableOrder(state: PosState): PosState {
  return {
    ...state,
    tables: [...state.tables]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((table, index) => ({ ...table, displayOrder: index }))
  };
}
