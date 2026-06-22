"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { adminErrorText, formatAdminText, useAdminLocale } from "@/components/admin/admin-preferences";
import { deleteMenuItem, getAdminAppData, saveMenuItem } from "@/lib/firebase/firestore";
import { localized } from "@/lib/i18n/config";
import { menuItemSchema } from "@/lib/validation/schemas";
import type { AppData, ImageHistoryEntry, MenuItem } from "@/types/models";

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
  const [formOpen, setFormOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [allergensText, setAllergensText] = useState("");
  const [dietaryText, setDietaryText] = useState("");
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
      .filter((item) => JSON.stringify({ ...item.name, tags: item.tags }).toLowerCase().includes(query.toLowerCase()))
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
      tags: splitList(tagsText),
      allergens: splitList(allergensText),
      dietaryLabels: splitList(dietaryText)
    } as MenuItem;
    try {
      await saveMenuItem(item);
      setData((current) => upsertMenuItem(current, item));
      form.reset(emptyItem);
      setTagsText("");
      setAllergensText("");
      setDietaryText("");
      setFormOpen(false);
      setMessage(formatAdminText(text.menuItemSavedNamed, { name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : text.menuItemSaved);
      setMessage("");
    } finally {
      setSaving(false);
    }
  }

  function edit(item: MenuItem) {
    setFormOpen(true);
    setMessage("");
    setError("");
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
    setTagsText(item.tags.join(", "));
    setAllergensText(item.allergens.join(", "));
    setDietaryText(item.dietaryLabels.join(", "));
  }

  function duplicate(item: MenuItem) {
    edit({ ...item, id: "", imageHistory: [], name: { ...item.name, en: `${item.name.en} Copy` }, displayOrder: item.displayOrder + 1 });
  }

  function newItem() {
    form.reset(emptyItem);
    setTagsText("");
    setAllergensText("");
    setDietaryText("");
    setMessage("");
    setError("");
    setFormOpen(true);
  }

  async function remove(item: MenuItem) {
    if (!window.confirm(formatAdminText(text.deleteItemConfirm, { name: localized(item.name, locale, item.name.en) }))) return;
    await deleteMenuItem(item.id);
    await refresh();
  }

  function addVariant() {
    const variants = form.getValues("variants") || [];
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
    <div className="grid gap-6 2xl:grid-cols-[520px_1fr]">
      <div className="space-y-3">
        {message ? <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-primary">{message}</p> : null}
        {error ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
        <Card>
          <CardHeader>
            <CardTitle>{text.menuItem}</CardTitle>
          </CardHeader>
          <CardContent>
            {formOpen ? (
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
            <div className="grid gap-4 md:grid-cols-3">
              <Field label={text.preparationMinutes}><Input type="number" {...form.register("preparationMinutes")} /></Field>
              <Field label={text.calories}><Input type="number" {...form.register("calories")} /></Field>
              <Field label={text.spicyLevel}><Input type="number" min={0} max={5} {...form.register("spicyLevel")} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label={text.tags}><Input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder={text.tagsPlaceholder} /></Field>
              <Field label={text.allergens}><Input value={allergensText} onChange={(event) => setAllergensText(event.target.value)} placeholder={text.allergensPlaceholder} /></Field>
              <Field label={text.dietaryLabels}><Input value={dietaryText} onChange={(event) => setDietaryText(event.target.value)} placeholder={text.dietaryLabelsPlaceholder} /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["isAvailable", text.available],
                ["isSoldOut", text.soldOut],
                ["isFeatured", text.featured],
                ["isPopular", text.popular],
                ["isNew", text.isNew]
              ].map(([name, label]) => (
                <div key={name} className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm font-medium">{label}</span>
                  <Switch
                    label={label}
                    checked={Boolean(form.watch(name as keyof MenuItemFormData))}
                    onCheckedChange={(checked) => form.setValue(name as keyof MenuItemFormData, checked as never)}
                  />
                </div>
              ))}
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
              onUploadingChange={setImageUploading}
            />
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{text.variants}</h3>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>{text.addVariant}</Button>
              </div>
              {form.watch("variants").map((variant, index) => (
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
              <Button type="button" variant="outline" onClick={newItem}>{text.new}</Button>
            </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{text.menuItemSaved}</p>
                <Button type="button" onClick={newItem}>{text.new}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold">{text.menuItems}</h1>
          <p className="text-muted-foreground">{text.menuItemDescription}</p>
        </div>
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
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                <div>
                  <p className="font-semibold">{localized(item.name, locale, item.name.en)}</p>
                  <p className="text-sm text-muted-foreground">{item.name.en} / {item.name.ar} / {item.name.ckb}</p>
                  <p className="text-xs text-muted-foreground">
                    {localized(data?.categories.find((category) => category.id === item.categoryId)?.name, locale, text.noCategory)} · {item.basePrice} {item.currency}
                    {item.isSoldOut ? ` · ${text.soldOut}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => edit(item)}>{text.edit}</Button>
                  <Button variant="outline" onClick={() => duplicate(item)}>{text.duplicate}</Button>
                  <Button variant="outline" onClick={() => window.open(`/menu/item/${item.id}`, "_blank")}>{text.preview}</Button>
                  <Button variant="destructive" onClick={() => remove(item)}>{text.delete}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
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
