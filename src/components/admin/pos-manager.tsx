"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Armchair,
  ArrowRightLeft,
  Coffee,
  Merge,
  Minus,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Table2,
  Trash2,
  Umbrella,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminErrorText, useAdminLocale } from "@/components/admin/admin-preferences";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { getAdminAppData, getPosState, savePosState } from "@/lib/firebase/firestore";
import { localized } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatMoney, normalizeSearch } from "@/lib/utils/format";
import type { AppData, Currency, MenuItem, PosCompletedOrder, PosDiscountType, PosOrderLine, PosState, PosTable, PosTableArea, PosTableOrder } from "@/types/models";

const emptyPosState: PosState = {
  tables: [],
  orders: {},
  completedOrders: []
};

export function PosManager() {
  const { locale, text, dir: textDir } = useAdminLocale();
  const auth = useAdminAuth();
  // Editing the table layout (add/rename/delete tables) is an admin-only setup
  // task. Employees with POS access can still take, transfer, merge and complete
  // orders — they just can't change the tables themselves. Default-deny while the
  // profile is still loading so the edit control never flashes in for an employee
  // (roleOf(null) optimistically returns "admin").
  const canManageTables = !auth.loading && auth.role === "admin";
  const [data, setData] = useState<AppData | null>(null);
  const [pos, setPos] = useState<PosState>(emptyPosState);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [tableNameDraft, setTableNameDraft] = useState("");
  const [draftTables, setDraftTables] = useState<PosTable[]>([]);
  const [draftOrders, setDraftOrders] = useState<PosState["orders"]>({});
  const [draftSelectedTableId, setDraftSelectedTableId] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [discountInput, setDiscountInput] = useState("");
  const [tableToolsOpen, setTableToolsOpen] = useState(false);
  const [tableAction, setTableAction] = useState<"move" | "merge" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const menuPickerRef = useRef<HTMLDivElement | null>(null);
  // Ticks once a minute so the per-table "time since last activity" chips refresh.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

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
  const tableSections = useMemo(() => groupTablesByArea(tables), [tables]);
  const draftTableSections = useMemo(() => groupTablesByArea(draftTables), [draftTables]);
  const selectedTable = tables.find((table) => table.id === selectedTableId) || tables[0];
  const selectedDraftTable = draftTables.find((table) => table.id === draftSelectedTableId);
  const selectedOrder = selectedTable ? pos.orders[selectedTable.id] || emptyOrder(selectedTable.id) : null;
  const posCurrency: Currency = data?.general.defaultCurrency ?? "IQD";
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

  useEffect(() => {
    setTableAction(null);
  }, [selectedTableId]);

  // Mirror the order's discount into the editable field, but keep an empty field
  // empty (so backspacing the value to nothing clears the zero instead of snapping back).
  useEffect(() => {
    const numeric = selectedOrder?.discountValue ?? 0;
    setDiscountInput((current) => {
      if (current !== "" && Number(current) === numeric) return current;
      if (current === "" && numeric === 0) return current;
      return String(numeric);
    });
  }, [selectedTableId, selectedOrder?.discountValue]);

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
    setTableAction(null);
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

  function changeDraftTableArea(area: PosTableArea) {
    setDraftTables((current) => normalizeTableOrder({
      ...pos,
      tables: current.map((table) => table.id === draftSelectedTableId ? { ...table, area } : table)
    }).tables);
  }

  function addDraftTable(area: PosTableArea) {
    const nextNumber = draftTables.filter((table) => tableArea(table) === area).length + 1;
    const table: PosTable = {
      id: crypto.randomUUID(),
      name: `${area === "outdoor" ? text.outdoorTable : text.indoorTable} ${nextNumber}`,
      area,
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
        .map((table) => ({ ...table, name: table.name.trim(), area: tableArea(table) }))
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

  function scrollToMenuPicker() {
    menuPickerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleTableAction(action: "move" | "merge") {
    if (!selectedTable || !selectedOrder?.lines.length) return;
    setTableAction((current) => (current === action ? null : action));
    setMessage("");
    setError("");
  }

  function pressTable(tableId: string) {
    if (tableAction === "move") {
      moveOrderToTable(tableId);
      return;
    }
    if (tableAction === "merge") {
      mergeOrderIntoTable(tableId);
      return;
    }
    setSelectedTableId(tableId);
    scrollToMenuPicker();
  }

  function moveOrderToTable(targetTableId: string) {
    if (!selectedTable || !selectedOrder?.lines.length) return;
    if (targetTableId === selectedTable.id) {
      setTableAction(null);
      return;
    }
    const targetTable = tables.find((table) => table.id === targetTableId);
    if (!targetTable) return;
    if (tableOrderLineCount(pos.orders[targetTable.id]) > 0) {
      setError(text.targetTableOccupied);
      return;
    }

    const movedOrder: PosTableOrder = {
      ...selectedOrder,
      tableId: targetTable.id,
      updatedAt: new Date().toISOString()
    };

    void persist({
      ...pos,
      orders: {
        ...pos.orders,
        [selectedTable.id]: emptyOrder(selectedTable.id),
        [targetTable.id]: movedOrder
      }
    }, text.orderMoved).then((saved) => {
      if (!saved) return;
      setSelectedTableId(targetTable.id);
      setTableAction(null);
    });
  }

  function mergeOrderIntoTable(targetTableId: string) {
    if (!selectedTable || !selectedOrder?.lines.length) return;
    if (targetTableId === selectedTable.id) {
      setTableAction(null);
      return;
    }
    const targetTable = tables.find((table) => table.id === targetTableId);
    if (!targetTable) return;

    const targetOrder = pos.orders[targetTable.id] || emptyOrder(targetTable.id);
    const mergedOrder: PosTableOrder = {
      ...targetOrder,
      tableId: targetTable.id,
      lines: mergeOrderLines(targetOrder.lines, selectedOrder.lines),
      updatedAt: new Date().toISOString()
    };

    void persist({
      ...pos,
      orders: {
        ...pos.orders,
        [selectedTable.id]: emptyOrder(selectedTable.id),
        [targetTable.id]: mergedOrder
      }
    }, text.orderMerged).then((saved) => {
      if (!saved) return;
      setSelectedTableId(targetTable.id);
      setTableAction(null);
      // Stay on the tables after merging (don't jump down to the menu picker).
    });
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
            {canManageTables ? (
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
            ) : null}
          </div>

          {!(tableToolsOpen && canManageTables) ? (
            <div className="space-y-3">
              <div className="space-y-4">
                {tableSections.map((section, index) => {
                  const occupiedCount = section.tables.filter((entry) => tableOrderLineCount(pos.orders[entry.id]) > 0).length;
                  const areaTotal = section.tables.reduce((sum, entry) => {
                    const tableOrder = pos.orders[entry.id];
                    return tableOrder ? sum + calculateTotals(tableOrder, posCurrency).total : sum;
                  }, 0);
                  return (
                    <div key={section.area} className={cn(index > 0 && "pt-2")}>
                      <TableAreaHeading
                        area={section.area}
                        text={text}
                        textDir={textDir}
                        locale={locale}
                        currency={posCurrency}
                        occupied={occupiedCount}
                        total={section.tables.length}
                        areaTotal={areaTotal}
                      />
                      {section.tables.length ? (
                        <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
                          {section.tables.map((table) => {
                            const order = pos.orders[table.id];
                            const count = tableOrderLineCount(order);
                            const occupied = count > 0;
                            const selected = table.id === selectedTable?.id;
                            const actionTarget = tableAction !== null && !selected;
                            // In move mode an occupied destination is blocked; in merge mode it is a valid target.
                            const blockedTarget = actionTarget && tableAction === "move" && occupied;
                            const orderTotal = occupied && order ? calculateTotals(order, posCurrency).total : 0;
                            const minutes = occupied && order?.updatedAt ? Math.max(0, Math.floor((now - Date.parse(order.updatedAt)) / 60000)) : null;
                            return (
                              <button
                                key={table.id}
                                type="button"
                                onClick={() => pressTable(table.id)}
                                className={cn(
                                  "focus-ring min-h-20 rounded-lg border p-3 text-start transition-[transform,background-color,border-color,color] duration-200 active:scale-[0.97]",
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground shadow-sm pos-tile-pop"
                                    : occupied
                                      ? "border-secondary bg-secondary/10 ring-1 ring-inset ring-secondary/40 hover:bg-secondary/20 pos-tile-glow"
                                      : "border-dashed bg-card hover:bg-muted",
                                  actionTarget && "ring-2 ring-primary/40",
                                  blockedTarget && "opacity-60"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span dir={textDir} className="min-w-0 truncate text-base font-semibold">{table.name}</span>
                                  <Coffee className={cn("h-4 w-4 shrink-0", selected ? "text-primary-foreground/90" : occupied ? "text-secondary" : "text-muted-foreground/30")} aria-hidden />
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  {occupied ? (
                                    <span dir={textDir} className={cn("truncate text-sm font-bold tabular-nums", selected ? "text-primary-foreground" : "text-foreground")}>
                                      {formatMoney(orderTotal, posCurrency, locale)}
                                    </span>
                                  ) : (
                                    <span dir={textDir} className={cn("truncate text-xs", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                      {text.noItemsOnTable}
                                    </span>
                                  )}
                                  {occupied && minutes !== null ? (
                                    <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums", selected ? "bg-primary-foreground/20 text-primary-foreground" : durationTone(minutes))}>
                                      {formatDuration(minutes)}
                                    </span>
                                  ) : null}
                                </div>
                                {occupied ? (
                                  <span className={cn("mt-1 block text-[10px]", selected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                    {count} {text.menuItems}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p dir={textDir} className="mt-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{text.noTablesInArea}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant={tableAction === "merge" ? "default" : "outline"}
                  size="icon"
                  aria-label={text.mergeOrder}
                  title={text.mergeOrder}
                  onClick={() => toggleTableAction("merge")}
                  disabled={!selectedOrder?.lines.length}
                >
                  <Merge className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant={tableAction === "move" ? "default" : "outline"}
                  size="icon"
                  aria-label={text.moveOrder}
                  title={text.moveOrder}
                  onClick={() => toggleTableAction("move")}
                  disabled={!selectedOrder?.lines.length}
                >
                  <ArrowRightLeft className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}

          {tableToolsOpen && canManageTables ? (
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
              <div className="space-y-4">
                {draftTableSections.map((section, index) => (
                  <div key={section.area} className={cn(index > 0 && "pt-2")}>
                    <TableAreaHeading area={section.area} text={text} textDir={textDir} />
                    {section.tables.length ? (
                      <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2">
                        {section.tables.map((table) => {
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
                    ) : (
                      <p dir={textDir} className="mt-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{text.noTablesInArea}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
                <Field label={text.tableName}>
                  <Input value={tableNameDraft} onChange={(event) => renameDraftTable(event.target.value)} disabled={!draftSelectedTableId} />
                </Field>
                <Field label={text.tableArea}>
                  <Select value={selectedDraftTable?.area || "indoor"} onChange={(event) => changeDraftTableArea(event.target.value as PosTableArea)} disabled={!draftSelectedTableId}>
                    <option value="indoor">{text.indoor}</option>
                    <option value="outdoor">{text.outdoor}</option>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                <Button type="button" variant="outline" onClick={() => addDraftTable("indoor")}>
                  <Plus className="h-4 w-4" aria-hidden />
                  {text.indoor}
                </Button>
                <Button type="button" variant="outline" onClick={() => addDraftTable("outdoor")}>
                  <Plus className="h-4 w-4" aria-hidden />
                  {text.outdoor}
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
        <div ref={menuPickerRef} className="min-h-0 scroll-mt-20">
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
        </div>

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
                    <Select
                      value={selectedOrder.discountType}
                      aria-label={text.discount}
                      title={selectedOrder.discountType === "percent" ? text.percentDiscount : text.amountDiscount}
                      onChange={(event) => setDiscountType(event.target.value as PosDiscountType)}
                    >
                      <option value="amount">{totals.currency}</option>
                      <option value="percent">%</option>
                    </Select>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={selectedOrder.discountType === "percent" ? 100 : undefined}
                      placeholder="0"
                      value={discountInput}
                      onFocus={(event) => event.currentTarget.select()}
                      onClick={(event) => event.currentTarget.select()}
                      onChange={(event) => {
                        setDiscountInput(event.target.value);
                        setDiscountValue(Number(event.target.value));
                      }}
                    />
                  </div>
                  <TotalRow label={text.subtotal} value={formatMoney(totals.subtotal, totals.currency, locale)} />
                  <TotalRow label={text.discount} value={`-${formatMoney(totals.discountAmount, totals.currency, locale)}`} />
                  <TotalRow label={text.total} value={formatMoney(totals.total, totals.currency, locale)} strong />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={completeOrder} disabled={!selectedOrder.lines.length}>
                    {text.completeOrder}
                  </Button>
                  <Button type="button" variant="outline" onClick={printInvoice} disabled={!selectedOrder.lines.length}>
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
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const tableAreas: PosTableArea[] = ["indoor", "outdoor"];

function groupTablesByArea(tables: PosTable[]) {
  return tableAreas.map((area) => ({
    area,
    tables: tables.filter((table) => tableArea(table) === area)
  }));
}

function tableArea(table: PosTable): PosTableArea {
  return table.area === "outdoor" ? "outdoor" : "indoor";
}

function tableOrderLineCount(order: PosTableOrder | undefined) {
  return order?.lines.reduce((sum, line) => sum + line.quantity, 0) || 0;
}

function mergeOrderLines(baseLines: PosOrderLine[], addedLines: PosOrderLine[]): PosOrderLine[] {
  const lines = baseLines.map((line) => ({ ...line }));
  for (const addedLine of addedLines) {
    const existing = lines.find((line) => line.itemId === addedLine.itemId && line.unitPrice === addedLine.unitPrice);
    if (existing) {
      existing.quantity += addedLine.quantity;
    } else {
      lines.push({ ...addedLine, id: crypto.randomUUID() });
    }
  }
  return lines;
}

function TableAreaHeading({
  area,
  text,
  textDir,
  locale,
  currency,
  occupied,
  total,
  areaTotal
}: {
  area: PosTableArea;
  text: Record<string, string>;
  textDir: "ltr" | "rtl";
  locale?: "en" | "ar" | "ckb";
  currency?: Currency;
  occupied?: number;
  total?: number;
  areaTotal?: number;
}) {
  const Icon = area === "outdoor" ? Umbrella : Armchair;
  return (
    <div className="flex items-center gap-2">
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", area === "outdoor" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary")}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span dir={textDir} className="text-sm font-semibold">
        {area === "outdoor" ? text.outdoorTables : text.indoorTables}
      </span>
      {typeof total === "number" && total > 0 ? (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          {occupied ?? 0}/{total}
        </span>
      ) : null}
      <span className="h-px flex-1 bg-border" aria-hidden />
      {areaTotal && areaTotal > 0 && currency && locale ? (
        <span className="shrink-0 text-xs font-semibold tabular-nums text-secondary">{formatMoney(areaTotal, currency, locale)}</span>
      ) : null}
    </div>
  );
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

// Idle-time chip color: fresh (neutral) → over 30 min (amber) → over an hour (red).
function durationTone(totalMinutes: number): string {
  if (totalMinutes >= 60) return "bg-destructive/15 text-destructive";
  if (totalMinutes >= 30) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
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
  locale
}: {
  restaurantName: string;
  table: PosTable;
  order: PosTableOrder;
  totals: PosTotals;
  locale: "en" | "ar" | "ckb";
}) {
  const receiptLocale: "en" | "ckb" = locale === "ckb" ? "ckb" : "en";
  const receiptDir = receiptLocale === "ckb" ? "rtl" : "ltr";
  const issuedAt = formatReceiptDateTime(new Date());
  const receiptName = restaurantName.trim() || "Stone Cafe";

  return (
    <div className="pos-print-area pos-receipt rounded-lg border bg-white p-5 font-mono text-black shadow-sm">
      <div className="text-center">
        <Image src="/stone-cafe-logo.jpg" alt="Stone Cafe logo" width={64} height={64} className="pos-receipt-logo mx-auto h-16 w-16 rounded-full object-cover" />
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.14em]">STONE CAFE</h2>
        <p className="text-[11px] uppercase tracking-[0.2em]">{receiptName}</p>
        <p className="mt-2 text-base font-black uppercase">Dine In</p>
        <p dir="rtl" className="text-sm font-bold">لە ناو کافێدا</p>
      </div>

      <ReceiptRule />

      <div className="grid grid-cols-2 text-sm font-bold tabular-nums">
        <span>{issuedAt.date}</span>
        <span className="text-right">{issuedAt.time}</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto] items-end gap-4 text-sm">
        <ReceiptLabel en="Table" ckb="مێز" />
        <span className="font-black">{table.name}</span>
      </div>

      <ReceiptRule />

      <div className="grid grid-cols-[1fr_auto] gap-4 text-base font-black">
        <ReceiptLabel en="Item" ckb="بڕگە" />
        <ReceiptLabel en="Rate" ckb="نرخ" align="end" />
      </div>

      <div className="mt-2 space-y-2">
        {order.lines.map((line) => (
          <div key={line.id} className="grid grid-cols-[1fr_auto] gap-4 text-sm">
            <div className="min-w-0">
              <p dir={receiptDir} className="break-words font-bold leading-tight">{localized(line.name, receiptLocale, line.name.en)}</p>
              <p className="text-[11px] tabular-nums">{line.quantity} x {formatMoney(line.unitPrice, line.currency, receiptLocale)}</p>
            </div>
            <p className="font-black tabular-nums">{formatMoney(line.quantity * line.unitPrice, line.currency, receiptLocale)}</p>
          </div>
        ))}
      </div>

      <ReceiptRule />

      <div className="space-y-2 text-sm">
        <ReceiptTotalRow en="Subtotal" ckb="کۆی لاوەکی" value={formatMoney(totals.subtotal, totals.currency, receiptLocale)} />
        {totals.discountAmount > 0 ? (
          <ReceiptTotalRow en="Discount" ckb="داشکاندن" value={`-${formatMoney(totals.discountAmount, totals.currency, receiptLocale)}`} />
        ) : null}
        <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-4 border-t-2 border-dashed border-black pt-3">
          <ReceiptLabel en="Total" ckb="کۆی گشتی" className="text-base font-black" />
          <span className="text-2xl font-black tabular-nums">{formatMoney(totals.total, totals.currency, receiptLocale)}</span>
        </div>
      </div>

      <ReceiptRule />

      <div className="text-center">
        <p className="text-base font-black">Thank You and Visit Again</p>
        <p dir="rtl" className="mt-1 text-base font-black">سوپاس، جارێکی تر سەردانمان بکەنەوە</p>
      </div>
    </div>
  );
}

function ReceiptRule() {
  return <div className="my-3 border-t-2 border-dashed border-black" aria-hidden />;
}

function ReceiptLabel({
  en,
  ckb,
  align = "start",
  className
}: {
  en: string;
  ckb: string;
  align?: "start" | "end";
  className?: string;
}) {
  return (
    <span className={cn("leading-tight", align === "end" && "text-right", className)}>
      <span className="block">{en}</span>
      <span dir="rtl" className="block text-[0.78em] font-bold">{ckb}</span>
    </span>
  );
}

function ReceiptTotalRow({ en, ckb, value }: { en: string; ckb: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-end gap-4">
      <ReceiptLabel en={en} ckb={ckb} />
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

function formatReceiptDateTime(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return {
    date: `${day}-${month}-${year}`,
    time: `${hours}:${minutes}`
  };
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
      .sort((a, b) => tableAreas.indexOf(tableArea(a)) - tableAreas.indexOf(tableArea(b)) || a.displayOrder - b.displayOrder)
      .map((table, index) => ({ ...table, area: tableArea(table), displayOrder: index }))
  };
}
