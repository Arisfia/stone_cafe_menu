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
import { deleteMenuItem, getAdminAppData, saveMenuItem } from "@/lib/firebase/firestore";
import { menuItemSchema } from "@/lib/validation/schemas";
import type { AppData, MenuItem } from "@/types/models";

type MenuItemFormData = z.infer<typeof menuItemSchema>;

const emptyItem: MenuItemFormData = {
  id: "",
  categoryId: "",
  name: { en: "", ar: "", ckb: "" },
  description: { en: "", ar: "", ckb: "" },
  ingredients: { en: "", ar: "", ckb: "" },
  imageUrl: "",
  imagePath: "",
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
  const [data, setData] = useState<AppData | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
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
    setSaving(true);
    setMessage("");
    const id = values.id || crypto.randomUUID();
    await saveMenuItem({
      ...values,
      id,
      tags: splitList(tagsText),
      allergens: splitList(allergensText),
      dietaryLabels: splitList(dietaryText)
    } as MenuItem);
    form.reset(emptyItem);
    setTagsText("");
    setAllergensText("");
    setDietaryText("");
    await refresh();
    setMessage("Menu item saved.");
    setSaving(false);
  }

  function edit(item: MenuItem) {
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
      imagePath: item.imagePath || ""
    });
    setTagsText(item.tags.join(", "));
    setAllergensText(item.allergens.join(", "));
    setDietaryText(item.dietaryLabels.join(", "));
  }

  function duplicate(item: MenuItem) {
    edit({ ...item, id: "", name: { ...item.name, en: `${item.name.en} Copy` }, displayOrder: item.displayOrder + 1 });
  }

  async function remove(item: MenuItem) {
    if (!window.confirm(`Delete ${item.name.en}?`)) return;
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
      <Card>
        <CardHeader>
          <CardTitle>Menu Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Field label="Category" error={form.formState.errors.categoryId?.message}>
              <Select {...form.register("categoryId")}>
                <option value="">Choose category</option>
                {(data?.categories || []).map((category) => (
                  <option key={category.id} value={category.id}>{category.name.en}</option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="English name" error={form.formState.errors.name?.en?.message}><Input {...form.register("name.en")} /></Field>
              <Field label="Arabic name" error={form.formState.errors.name?.ar?.message}><Input dir="rtl" {...form.register("name.ar")} /></Field>
              <Field label="Kurdish name" error={form.formState.errors.name?.ckb?.message}><Input dir="rtl" {...form.register("name.ckb")} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="English description"><Textarea {...form.register("description.en")} /></Field>
              <Field label="Arabic description"><Textarea dir="rtl" {...form.register("description.ar")} /></Field>
              <Field label="Kurdish description"><Textarea dir="rtl" {...form.register("description.ckb")} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="English ingredients"><Input {...form.register("ingredients.en")} /></Field>
              <Field label="Arabic ingredients"><Input dir="rtl" {...form.register("ingredients.ar")} /></Field>
              <Field label="Kurdish ingredients"><Input dir="rtl" {...form.register("ingredients.ckb")} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Base price"><Input type="number" {...form.register("basePrice")} /></Field>
              <Field label="Discount price"><Input type="number" {...form.register("discountPrice")} /></Field>
              <Field label="Currency">
                <Select {...form.register("currency")}>
                  <option value="IQD">IQD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="TRY">TRY</option>
                </Select>
              </Field>
              <Field label="Display order"><Input type="number" {...form.register("displayOrder")} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Preparation minutes"><Input type="number" {...form.register("preparationMinutes")} /></Field>
              <Field label="Calories"><Input type="number" {...form.register("calories")} /></Field>
              <Field label="Spicy level"><Input type="number" min={0} max={5} {...form.register("spicyLevel")} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Tags"><Input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="coffee, cold" /></Field>
              <Field label="Allergens"><Input value={allergensText} onChange={(event) => setAllergensText(event.target.value)} placeholder="Dairy, nuts" /></Field>
              <Field label="Dietary labels"><Input value={dietaryText} onChange={(event) => setDietaryText(event.target.value)} placeholder="vegetarian, sugar-free" /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["isAvailable", "Available"],
                ["isSoldOut", "Sold out"],
                ["isFeatured", "Featured"],
                ["isPopular", "Popular"],
                ["isNew", "New"]
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
              label="Item image"
              path={`menu-items/${form.watch("id") || "new"}`}
              imageUrl={form.watch("imageUrl") || ""}
              onUploaded={(result) => {
                form.setValue("imageUrl", result.imageUrl);
                form.setValue("imagePath", result.imagePath);
              }}
            />
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Variants</h3>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>Add variant</Button>
              </div>
              {form.watch("variants").map((variant, index) => (
                <div key={variant.id} className="grid gap-2 rounded-md bg-muted/50 p-3 md:grid-cols-5">
                  <Input {...form.register(`variants.${index}.name.en`)} placeholder="English" />
                  <Input dir="rtl" {...form.register(`variants.${index}.name.ar`)} placeholder="Arabic" />
                  <Input dir="rtl" {...form.register(`variants.${index}.name.ckb`)} placeholder="Kurdish" />
                  <Input type="number" {...form.register(`variants.${index}.price`)} placeholder="Price" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue("variants", form.getValues("variants").filter((_, entryIndex) => entryIndex !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            {message ? <p className="text-sm text-primary">{message}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save item"}</Button>
              <Button type="button" variant="outline" onClick={() => form.reset(emptyItem)}>New</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold">Menu Items</h1>
          <p className="text-muted-foreground">Create, edit, duplicate, delete, filter, preview, and manage item status.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Search items" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {(data?.categories || []).map((category) => (
              <option key={category.id} value={category.id}>{category.name.en}</option>
            ))}
          </Select>
          <Select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="sold-out">Sold out</option>
            <option value="missing-translations">Missing translations</option>
          </Select>
        </div>
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                <div>
                  <p className="font-semibold">{item.name.en}</p>
                  <p className="text-sm text-muted-foreground">{item.name.ar} / {item.name.ckb}</p>
                  <p className="text-xs text-muted-foreground">
                    {data?.categories.find((category) => category.id === item.categoryId)?.name.en || "No category"} · {item.basePrice} {item.currency}
                    {item.isSoldOut ? " · Sold out" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => edit(item)}>Edit</Button>
                  <Button variant="outline" onClick={() => duplicate(item)}>Duplicate</Button>
                  <Button variant="outline" onClick={() => window.open(`/menu/item/${item.id}`, "_blank")}>Preview</Button>
                  <Button variant="destructive" onClick={() => remove(item)}>Delete</Button>
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
