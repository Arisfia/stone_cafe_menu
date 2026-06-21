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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { adminErrorText, formatAdminText, useAdminLocale } from "@/components/admin/admin-preferences";
import { getAdminAppData, deleteCategory, saveCategory, saveMenuItem } from "@/lib/firebase/firestore";
import { localized } from "@/lib/i18n/config";
import { slugify } from "@/lib/utils/format";
import { categorySchema } from "@/lib/validation/schemas";
import type { AppData, Category } from "@/types/models";

type CategoryFormData = z.infer<typeof categorySchema>;

const emptyCategory: CategoryFormData = {
  id: "",
  name: { en: "", ar: "", ckb: "" },
  description: { en: "", ar: "", ckb: "" },
  imageUrl: "",
  imagePath: "",
  slug: "",
  displayOrder: 0,
  isActive: true
};

export function CategoryManager() {
  const { locale, text } = useAdminLocale();
  const [data, setData] = useState<AppData | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [moveTarget, setMoveTarget] = useState("");
  const form = useForm<CategoryFormData>({ resolver: zodResolver(categorySchema), defaultValues: emptyCategory });

  async function refresh() {
    setData(await getAdminAppData());
  }

  useEffect(() => {
    refresh();
  }, []);

  const categories = useMemo(() => {
    const list = data?.categories || [];
    return list
      .filter((entry) => statusFilter === "all" || (statusFilter === "active" ? entry.isActive : !entry.isActive))
      .filter((entry) => JSON.stringify(entry.name).toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [data, query, statusFilter]);

  async function onSubmit(values: CategoryFormData) {
    setSaving(true);
    setMessage("");
    await saveCategory({ ...values, id: values.id || slugify(values.name.en) } as Category);
    form.reset(emptyCategory);
    await refresh();
    setMessage(text.categorySaved);
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteTarget || !data) return;
    const items = data.menuItems.filter((item) => item.categoryId === deleteTarget.id);
    if (items.length && !moveTarget) return;
    setSaving(true);
    if (moveTarget) {
      await Promise.all(items.map((item) => saveMenuItem({ ...item, categoryId: moveTarget })));
    }
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
    setMoveTarget("");
    await refresh();
    setSaving(false);
  }

  function edit(category: Category) {
    form.reset({
      ...category,
      imageUrl: category.imageUrl || "",
      imagePath: category.imagePath || "",
      description: {
        en: category.description.en || "",
        ar: category.description.ar || "",
        ckb: category.description.ckb || ""
      }
    });
  }

  const targetItemCount = deleteTarget ? data?.menuItems.filter((item) => item.categoryId === deleteTarget.id).length || 0 : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{text.category}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Field label={text.englishName} error={adminErrorText(form.formState.errors.name?.en?.message, text)}>
              <Input {...form.register("name.en")} onBlur={(event) => !form.getValues("slug") && form.setValue("slug", slugify(event.target.value))} />
            </Field>
            <Field label={text.arabicName} error={adminErrorText(form.formState.errors.name?.ar?.message, text)}>
              <Input dir="rtl" {...form.register("name.ar")} />
            </Field>
            <Field label={text.kurdishName} error={adminErrorText(form.formState.errors.name?.ckb?.message, text)}>
              <Input dir="rtl" {...form.register("name.ckb")} />
            </Field>
            <Field label={text.englishDescription}>
              <Textarea {...form.register("description.en")} />
            </Field>
            <Field label={text.arabicDescription}>
              <Textarea dir="rtl" {...form.register("description.ar")} />
            </Field>
            <Field label={text.kurdishDescription}>
              <Textarea dir="rtl" {...form.register("description.ckb")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={text.slug} error={adminErrorText(form.formState.errors.slug?.message, text)}>
                <Input {...form.register("slug")} />
              </Field>
              <Field label={text.displayOrder}>
                <Input type="number" {...form.register("displayOrder")} />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm font-medium">{text.active}</span>
              <Switch label={text.active} checked={form.watch("isActive")} onCheckedChange={(checked) => form.setValue("isActive", checked)} />
            </div>
            <ImageUploadField
              label={text.categoryImage}
              text={text}
              path={`categories/${form.watch("id") || "new"}`}
              imageUrl={form.watch("imageUrl") || ""}
              onUploaded={(result) => {
                form.setValue("imageUrl", result.imageUrl);
                form.setValue("imagePath", result.imagePath);
              }}
            />
            {message ? <p className="text-sm text-primary">{message}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? text.saving : text.saveCategory}</Button>
              <Button type="button" variant="outline" onClick={() => form.reset(emptyCategory)}>{text.new}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold">{text.categories}</h1>
          <p className="text-muted-foreground">{text.categoryDescription}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <Input placeholder={text.searchCategories} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">{text.all}</option>
            <option value="active">{text.active}</option>
            <option value="inactive">{text.inactive}</option>
          </Select>
        </div>
        <div className="grid gap-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                <div>
                  <p className="font-semibold">{localized(category.name, locale, category.name.en)}</p>
                  <p className="text-sm text-muted-foreground">{category.name.en} / {category.name.ar} / {category.name.ckb}</p>
                  <p className="text-xs text-muted-foreground">
                    {text.order} {category.displayOrder} · {category.isActive ? text.active : text.inactive}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => edit(category)}>{text.edit}</Button>
                  <Button type="button" variant="outline" onClick={() => window.open(`/menu/category/${category.slug}`, "_blank")}>{text.preview}</Button>
                  <Button type="button" variant="destructive" onClick={() => setDeleteTarget(category)}>{text.delete}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{text.deleteCategory}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {targetItemCount
                  ? formatAdminText(text.categoryHasItems, { count: targetItemCount })
                  : text.categoryHasNoItems}
              </p>
              {targetItemCount ? (
                <Select value={moveTarget} onChange={(event) => setMoveTarget(event.target.value)}>
                  <option value="">{text.chooseDestinationCategory}</option>
                  {(data?.categories || [])
                    .filter((category) => category.id !== deleteTarget.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>{localized(category.name, locale, category.name.en)}</option>
                    ))}
                </Select>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>{text.cancel}</Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={saving || (targetItemCount > 0 && !moveTarget)}>{text.delete}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
