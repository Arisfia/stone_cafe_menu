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
import { getAdminAppData, deleteCategory, saveCategory, saveMenuItem } from "@/lib/firebase/firestore";
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
    setMessage("Category saved.");
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
          <CardTitle>Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Field label="English name" error={form.formState.errors.name?.en?.message}>
              <Input {...form.register("name.en")} onBlur={(event) => !form.getValues("slug") && form.setValue("slug", slugify(event.target.value))} />
            </Field>
            <Field label="Arabic name" error={form.formState.errors.name?.ar?.message}>
              <Input dir="rtl" {...form.register("name.ar")} />
            </Field>
            <Field label="Kurdish name" error={form.formState.errors.name?.ckb?.message}>
              <Input dir="rtl" {...form.register("name.ckb")} />
            </Field>
            <Field label="English description">
              <Textarea {...form.register("description.en")} />
            </Field>
            <Field label="Arabic description">
              <Textarea dir="rtl" {...form.register("description.ar")} />
            </Field>
            <Field label="Kurdish description">
              <Textarea dir="rtl" {...form.register("description.ckb")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug" error={form.formState.errors.slug?.message}>
                <Input {...form.register("slug")} />
              </Field>
              <Field label="Display order">
                <Input type="number" {...form.register("displayOrder")} />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm font-medium">Active</span>
              <Switch label="Active" checked={form.watch("isActive")} onCheckedChange={(checked) => form.setValue("isActive", checked)} />
            </div>
            <ImageUploadField
              label="Category image"
              path={`categories/${form.watch("id") || "new"}`}
              imageUrl={form.watch("imageUrl") || ""}
              onUploaded={(result) => {
                form.setValue("imageUrl", result.imageUrl);
                form.setValue("imagePath", result.imagePath);
              }}
            />
            {message ? <p className="text-sm text-primary">{message}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save category"}</Button>
              <Button type="button" variant="outline" onClick={() => form.reset(emptyCategory)}>New</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold">Categories</h1>
          <p className="text-muted-foreground">Create, edit, preview, activate, deactivate, search, filter, and reorder categories.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <Input placeholder="Search categories" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="grid gap-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                <div>
                  <p className="font-semibold">{category.name.en}</p>
                  <p className="text-sm text-muted-foreground">{category.name.ar} / {category.name.ckb}</p>
                  <p className="text-xs text-muted-foreground">Order {category.displayOrder} · {category.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => edit(category)}>Edit</Button>
                  <Button type="button" variant="outline" onClick={() => window.open(`/menu/category/${category.slug}`, "_blank")}>Preview</Button>
                  <Button type="button" variant="destructive" onClick={() => setDeleteTarget(category)}>Delete</Button>
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
              <CardTitle>Delete category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {targetItemCount
                  ? `This category contains ${targetItemCount} menu item(s). Move them before deleting.`
                  : "This category has no menu items."}
              </p>
              {targetItemCount ? (
                <Select value={moveTarget} onChange={(event) => setMoveTarget(event.target.value)}>
                  <option value="">Choose destination category</option>
                  {(data?.categories || [])
                    .filter((category) => category.id !== deleteTarget.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>{category.name.en}</option>
                    ))}
                </Select>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={saving || (targetItemCount > 0 && !moveTarget)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
