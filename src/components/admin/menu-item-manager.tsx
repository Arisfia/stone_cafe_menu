"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { ChevronDown, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { adminErrorText, formatAdminText, useAdminLocale } from "@/components/admin/admin-preferences";
import { deleteMenuItem, getAdminAppData, saveMenuItem, updateMenuItemAvailability } from "@/lib/firebase/firestore";
import { localized } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import { menuItemSchema } from "@/lib/validation/schemas";
import type { AppData, ImageHistoryEntry, Locale, MenuItem } from "@/types/models";

type MenuItemFormData = z.infer<typeof menuItemSchema>;

const emptyItem: MenuItemFormData = {
  id: "",
  categoryId: "",
  name: { en: "", ar: "", ckb: "" },
  description: { en: "", ar: "", ckb: "" },
  ingredients: { en: "", ar: "", ckb: "" },
  imageUrl: "",
  imagePath: "",
  imageHistory: [],
  basePrice: 0,
  discountPrice: undefined,
  currency: "IQD",
  preparationMinutes: undefined,
  calories: undefined,
  spicyLevel: 0,
  dietaryLabels: [],
  allergens: [],
  tags: [],
  variants: [],
  isAvailable: true,
  isSoldOut: false,
  isFeatured: false,
  isPopular: false,
  isNew: false,
  displayOrder: 0
};

export function MenuItemManager() {
  const { locale, text } = useAdminLocale();
  const [data, setData] = useState<AppData | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [statusSavingIds, setStatusSavingIds] = useState<string[]>([]);
  const form = useForm<MenuItemFormData>({ resolver: zodResolver(menuItemSchema), defaultValues: emptyItem });

  async function refresh() {
    setData(await getAdminAppData());
  }

  useEffect(() => {
    refresh();
  }, []);

  const items = useMemo(() => {
    const list = data?.menuItems || [];
    return list
      .filter((item) => categoryFilter === "all" || item.categoryId === categoryFilter)
      .filter((item) => {
        if (availabilityFilter === "available") return item.isAvailable && !item.isSoldOut;
        if (availabilityFilter === "sold-out") return item.isSoldOut;
        if (availabilityFilter === "missing-translations") return !item.name.en || !item.name.ar || !item.name.ckb;
        return true;
      })
      .filter((item) => JSON.stringify(item.name).toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [availabilityFilter, categoryFilter, data, query]);

  async function onSubmit(values: MenuItemFormData) {
    const name = localized(values.name, locale, values.name.en || text.menuItem);
    if (imageUploading) {
      setError(text.imageUploadInProgress);
      return;
    }
    setSaving(true);
    setError("");
    setMessage(formatAdminText(text.savingItem, { name }));
    const id = values.id || crypto.randomUUID();
    const item = {
      ...values,
      id,
      preparationMinutes: undefined,
      calories: undefined,
      spicyLevel: 0,
      dietaryLabels: [],
      allergens: [],
      tags: [],
      isFeatured: false,
      isPopular: false,
      isNew: false
    } as MenuItem;
    try {
      await saveMenuItem(item);
      setData((current) => upsertMenuItem(current, item));
      form.reset(emptyItem);
      setFormOpen(false);
      setEditingItemId(null);
      setExpandedItemId(id);
      setMessage(formatAdminText(text.menuItemSavedNamed, { name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : text.menuItemSaved);
      setMessage("");
    } finally {
      setSaving(false);
    }
  }

  function edit(item: MenuItem) {
    setFormOpen(false);
    setExpandedItemId(item.id);
    setEditingItemId(item.id);
    setMessage("");
    setError("");
    setImageUploading(false);
    form.reset({
      ...item,
      description: {
        en: item.description.en || "",
        ar: item.description.ar || "",
        ckb: item.description.ckb || ""
      },
      ingredients: {
        en: item.ingredients?.en || "",
        ar: item.ingredients?.ar || "",
        ckb: item.ingredients?.ckb || ""
      },
      imageUrl: item.imageUrl || "",
      imagePath: item.imagePath || "",
      imageHistory: activeImageHistory(item.imageHistory)
    });
  }

  function newItem() {
    form.reset(emptyItem);
    setMessage("");
    setError("");
    setImageUploading(false);
    setEditingItemId(null);
    setExpandedItemId(null);
    setFormOpen(true);
  }

  function cancelEdit() {
    setEditingItemId(null);
    setImageUploading(false);
    form.reset(emptyItem);
  }

  async function remove(item: MenuItem) {
    if (!window.confirm(formatAdminText(text.deleteItemConfirm, { name: localized(item.name, locale, item.name.en) }))) return;
    await deleteMenuItem(item.id);
    await refresh();
  }

  async function toggleItemAvailable(item: MenuItem, isAvailable: boolean) {
    const nextItem = { ...item, isAvailable };
    const name = localized(item.name, locale, item.name.en);

    setStatusSavingIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
    setMessage("");
    setError("");
    setData((current) => upsertMenuItem(current, nextItem));

    try {
      await updateMenuItemAvailability(item.id, isAvailable);
      setMessage(`${name}: ${isAvailable ? text.available : text.inactive}`);
    } catch (err) {
      setData((current) => upsertMenuItem(current, item));
      setError(err instanceof Error ? err.message : text.menuItemSaved);
    } finally {
      setStatusSavingIds((current) => current.filter((id) => id !== item.id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{text.menuItems}</h1>
          <p className="text-muted-foreground">{text.menuItemDescription}</p>
        </div>
        <Button type="button" onClick={newItem}>
          <PlusCircle className="h-4 w-4" aria-hidden />
          {text.addNewMenuItem}
        </Button>
      </div>

      {message ? <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

      {formOpen ? (
        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>{text.menuItem}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <MenuItemEditorForm
              form={form}
              data={data}
              locale={locale}
              text={text}
              saving={saving}
              imageUploading={imageUploading}
              onUploadingChange={setImageUploading}
              onSubmit={onSubmit}
              onCancel={() => setFormOpen(false)}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder={text.searchItems} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">{text.allCategories}</option>
            {(data?.categories || []).map((category) => (
              <option key={category.id} value={category.id}>{localized(category.name, locale, category.name.en)}</option>
            ))}
          </Select>
          <Select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
            <option value="all">{text.allStatuses}</option>
            <option value="available">{text.available}</option>
            <option value="sold-out">{text.soldOut}</option>
            <option value="missing-translations">{text.missingTranslations}</option>
          </Select>
        </div>
        <div className="grid gap-3">
          {items.map((item) => {
            const categoryName = localized(data?.categories.find((category) => category.id === item.categoryId)?.name, locale, text.noCategory);
            const expanded = expandedItemId === item.id;
            const statusSaving = statusSavingIds.includes(item.id);
            return (
              <Card key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-5 transition-colors hover:bg-muted/50">
                  <button
                    type="button"
                    className="focus-ring flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md text-start"
                    aria-expanded={expanded}
                    onClick={() => setExpandedItemId((current) => (current === item.id ? null : item.id))}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{localized(item.name, locale, item.name.en)}</p>
                      <p className="text-sm text-muted-foreground">{item.name.en} / {item.name.ar} / {item.name.ckb}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryName} · {item.basePrice} {item.currency}
                        {item.isSoldOut ? ` · ${text.soldOut}` : ""}
                      </p>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} aria-hidden />
                  </button>
                  <div className="flex shrink-0 items-center gap-2 rounded-md border bg-background px-3 py-2">
                    <span className={cn("text-xs font-semibold", item.isAvailable ? "text-primary" : "text-muted-foreground")}>
                      {item.isAvailable ? text.available : text.inactive}
                    </span>
                    <Switch
                      label={`${text.available}: ${localized(item.name, locale, item.name.en)}`}
                      checked={item.isAvailable}
                      disabled={statusSaving}
                      onCheckedChange={(checked) => toggleItemAvailable(item, checked)}
                    />
                  </div>
                </div>
                {expanded ? (
                  <CardContent className="settings-panel border-t pt-5">
                    {editingItemId === item.id ? (
                      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <MenuItemEditorForm
                          form={form}
                          data={data}
                          locale={locale}
                          text={text}
                          saving={saving}
                          imageUploading={imageUploading}
                          onUploadingChange={setImageUploading}
                          onSubmit={onSubmit}
                          onCancel={cancelEdit}
                        />
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
                        <MenuItemAdminPreview item={item} locale={locale} text={text} />
                        <div className="flex flex-wrap content-start gap-2">
                          <Button type="button" variant="outline" size="icon" aria-label={text.edit} title={text.edit} onClick={() => edit(item)}>
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button type="button" variant="destructive" size="icon" aria-label={text.delete} title={text.delete} onClick={() => remove(item)}>
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MenuItemEditorForm({
  form,
  data,
  locale,
  text,
  saving,
  imageUploading,
  onUploadingChange,
  onSubmit,
  onCancel
}: {
  form: UseFormReturn<MenuItemFormData>;
  data: AppData | null;
  locale: Locale;
  text: Record<string, string>;
  saving: boolean;
  imageUploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onSubmit: (values: MenuItemFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const watchedItem = form.watch();
  const variants = form.watch("variants") || [];

  function addVariant() {
    form.setValue("variants", [
      ...variants,
      {
        id: crypto.randomUUID(),
        name: { en: "Regular", ar: "عادي", ckb: "ئاسایی" },
        price: form.getValues("basePrice"),
        isAvailable: true,
        displayOrder: variants.length + 1
      }
    ]);
  }

  return (
    <>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label={text.category} error={adminErrorText(form.formState.errors.categoryId?.message, text)}>
          <Select {...form.register("categoryId")}>
            <option value="">{text.chooseCategory}</option>
            {(data?.categories || []).map((category) => (
              <option key={category.id} value={category.id}>{localized(category.name, locale, category.name.en)}</option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={text.englishName} error={adminErrorText(form.formState.errors.name?.en?.message, text)}><Input {...form.register("name.en")} /></Field>
          <Field label={text.arabicName} error={adminErrorText(form.formState.errors.name?.ar?.message, text)}><Input dir="rtl" {...form.register("name.ar")} /></Field>
          <Field label={text.kurdishName} error={adminErrorText(form.formState.errors.name?.ckb?.message, text)}><Input dir="rtl" {...form.register("name.ckb")} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={text.englishDescription}><Textarea {...form.register("description.en")} /></Field>
          <Field label={text.arabicDescription}><Textarea dir="rtl" {...form.register("description.ar")} /></Field>
          <Field label={text.kurdishDescription}><Textarea dir="rtl" {...form.register("description.ckb")} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={text.englishIngredients}><Input {...form.register("ingredients.en")} /></Field>
          <Field label={text.arabicIngredients}><Input dir="rtl" {...form.register("ingredients.ar")} /></Field>
          <Field label={text.kurdishIngredients}><Input dir="rtl" {...form.register("ingredients.ckb")} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label={text.basePrice}><Input type="number" {...form.register("basePrice")} /></Field>
          <Field label={text.discountPrice}><Input type="number" {...form.register("discountPrice")} /></Field>
          <Field label={text.currency}>
            <Select {...form.register("currency")}>
              <option value="IQD">IQD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TRY">TRY</option>
            </Select>
          </Field>
          <Field label={text.displayOrder}><Input type="number" {...form.register("displayOrder")} /></Field>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm font-medium">{text.soldOut}</span>
          <Switch
            label={text.soldOut}
            checked={Boolean(form.watch("isSoldOut"))}
            onCheckedChange={(checked) => form.setValue("isSoldOut", checked)}
          />
        </div>
        <ImageUploadField
          label={text.itemImage}
          text={text}
          path={`menu-items/${form.watch("id") || "new"}`}
          imageUrl={form.watch("imageUrl") || ""}
          imageHistory={form.watch("imageHistory") || []}
          onUploaded={(result) => {
            form.setValue("imageHistory", addCurrentImageToHistory(form.getValues()), { shouldDirty: true });
            form.setValue("imageUrl", result.imageUrl, { shouldDirty: true, shouldValidate: true });
            form.setValue("imagePath", result.imagePath, { shouldDirty: true });
          }}
          onRemoved={() => {
            form.setValue("imageHistory", addCurrentImageToHistory(form.getValues()), { shouldDirty: true });
            form.setValue("imageUrl", "", { shouldDirty: true, shouldValidate: true });
            form.setValue("imagePath", "", { shouldDirty: true });
          }}
          onRollback={(entry) => {
            const values = form.getValues();
            const history = addCurrentImageToHistory({
              imageUrl: values.imageUrl,
              imagePath: values.imagePath,
              imageHistory: (values.imageHistory || []).filter((item) => item.id !== entry.id)
            });
            form.setValue("imageUrl", entry.imageUrl, { shouldDirty: true, shouldValidate: true });
            form.setValue("imagePath", entry.imagePath, { shouldDirty: true });
            form.setValue("imageHistory", history, { shouldDirty: true });
          }}
          onUploadingChange={onUploadingChange}
        />
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-medium">{text.variants}</h3>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>{text.addVariant}</Button>
          </div>
          {variants.map((variant, index) => (
            <div key={variant.id} className="grid gap-2 rounded-md bg-muted/50 p-3 md:grid-cols-5">
              <Input {...form.register(`variants.${index}.name.en`)} placeholder={text.english} />
              <Input dir="rtl" {...form.register(`variants.${index}.name.ar`)} placeholder={text.arabic} />
              <Input dir="rtl" {...form.register(`variants.${index}.name.ckb`)} placeholder={text.kurdish} />
              <Input type="number" {...form.register(`variants.${index}.price`)} placeholder={text.price} />
              <Button
                type="button"
                variant="outline"
                onClick={() => form.setValue("variants", form.getValues("variants").filter((_, entryIndex) => entryIndex !== index))}
              >
                {text.remove}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving || imageUploading}>{saving ? text.saving : text.saveItem}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>{text.cancel}</Button>
        </div>
      </form>
      <MenuItemAdminPreview
        item={watchedItem}
        locale={locale}
        text={text}
      />
    </>
  );
}

function MenuItemAdminPreview({
  item,
  locale,
  text
}: {
  item: MenuItemFormData | MenuItem;
  locale: Locale;
  text: Record<string, string>;
}) {
  const title = localized(item.name, locale, item.name.en || text.menuItem);
  const description = localized(item.description, locale);
  const hasDiscount = typeof item.discountPrice === "number" && item.discountPrice > 0;

  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <p className="mb-3 text-sm font-medium">{text.preview}</p>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="relative aspect-[5/4] bg-gradient-to-br from-accent via-primary/10 to-secondary/10">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-lg font-semibold text-primary/70">
              {title}
            </div>
          )}
          {item.isSoldOut ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/65 backdrop-blur-[2px]">
              <span className="rounded-full border border-destructive bg-background/90 px-4 py-1.5 text-sm font-semibold text-destructive">
                {text.soldOut}
              </span>
            </div>
          ) : null}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-tight">{title}</h3>
            </div>
            <div className="shrink-0 text-end">
              {hasDiscount ? (
                <>
                  <p className="text-xs text-muted-foreground line-through">{formatMoney(item.basePrice, item.currency, locale)}</p>
                  <p className="text-sm font-bold text-secondary">{formatMoney(item.discountPrice as number, item.currency, locale)}</p>
                </>
              ) : (
                <p className="text-sm font-bold text-primary">{formatMoney(item.basePrice, item.currency, locale)}</p>
              )}
            </div>
          </div>
          {description ? <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

function addCurrentImageToHistory({
  imageUrl,
  imagePath,
  imageHistory = []
}: {
  imageUrl?: string;
  imagePath?: string;
  imageHistory?: ImageHistoryEntry[];
}) {
  const active = activeImageHistory(imageHistory);
  if (!imageUrl || !imagePath) return active;
  const createdAt = new Date();
  const previous: ImageHistoryEntry = {
    id: crypto.randomUUID(),
    imageUrl,
    imagePath,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  return [previous, ...active.filter((entry) => entry.imagePath !== imagePath && entry.imageUrl !== imageUrl)];
}

function activeImageHistory(history: ImageHistoryEntry[] = []) {
  const now = Date.now();
  return history.filter((entry) => Number.isFinite(Date.parse(entry.expiresAt)) && Date.parse(entry.expiresAt) > now);
}

function upsertMenuItem(data: AppData | null, item: MenuItem): AppData | null {
  if (!data) return data;
  const exists = data.menuItems.some((entry) => entry.id === item.id);
  return {
    ...data,
    menuItems: exists
      ? data.menuItems.map((entry) => (entry.id === item.id ? item : entry))
      : [...data.menuItems, item]
  };
}
