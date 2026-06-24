"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { ChevronDown, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { adminErrorText, formatAdminText, useAdminLocale } from "@/components/admin/admin-preferences";
import { getAdminAppData, deleteCategory, saveCategory, saveMenuItem, updateCategoryActive } from "@/lib/firebase/firestore";
import { localized } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";
import { slugify } from "@/lib/utils/format";
import { categorySchema } from "@/lib/validation/schemas";
import type { AppData, Category, Locale } from "@/types/models";

type CategoryFormData = z.infer<typeof categorySchema>;

const emptyCategory: CategoryFormData = {
  id: "",
  name: { en: "", ar: "", ckb: "" },
  description: { en: "", ar: "", ckb: "" },
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
  const [formOpen, setFormOpen] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [statusSavingIds, setStatusSavingIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [moveTarget, setMoveTarget] = useState("");
  const form = useForm<CategoryFormData>({ resolver: zodResolver(categorySchema), defaultValues: emptyCategory });
  const watchedCategory = form.watch();

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
    const id = values.id || slugify(values.name.en);
    setSaving(true);
    setMessage("");
    setError("");
    await saveCategory({ ...values, id } as Category);
    form.reset(emptyCategory);
    await refresh();
    setMessage(text.categorySaved);
    setFormOpen(false);
    setExpandedCategoryId(id);
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
    setFormOpen(true);
    setExpandedCategoryId(category.id);
    setMessage("");
    setError("");
    form.reset({
      id: category.id,
      name: category.name,
      slug: category.slug,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      description: {
        en: category.description.en || "",
        ar: category.description.ar || "",
        ckb: category.description.ckb || ""
      }
    });
  }

  function newCategory() {
    form.reset(emptyCategory);
    setMessage("");
    setError("");
    setFormOpen(true);
    setExpandedCategoryId(null);
  }

  async function toggleCategoryActive(category: Category, isActive: boolean) {
    const nextCategory = { ...category, isActive };
    const name = localized(category.name, locale, category.name.en);

    setStatusSavingIds((current) => (current.includes(category.id) ? current : [...current, category.id]));
    setMessage("");
    setError("");
    setData((current) => replaceCategory(current, nextCategory));

    try {
      await updateCategoryActive(category.id, isActive);
      setMessage(`${name}: ${isActive ? text.active : text.inactive}`);
    } catch (err) {
      setData((current) => replaceCategory(current, category));
      setError(err instanceof Error ? err.message : text.categorySaved);
    } finally {
      setStatusSavingIds((current) => current.filter((id) => id !== category.id));
    }
  }

  const targetItemCount = deleteTarget ? data?.menuItems.filter((item) => item.categoryId === deleteTarget.id).length || 0 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{text.categories}</h1>
          <p className="text-muted-foreground">{text.categoryDescription}</p>
        </div>
        <Button type="button" onClick={newCategory}>
          <PlusCircle className="h-4 w-4" aria-hidden />
          {text.addCategory}
        </Button>
      </div>

      {message ? <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

      {formOpen ? (
        <Card className="settings-panel">
          <CardHeader>
            <CardTitle>{text.category}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label={text.englishName} error={adminErrorText(form.formState.errors.name?.en?.message, text)}>
                  <Input {...form.register("name.en")} onBlur={(event) => !form.getValues("slug") && form.setValue("slug", slugify(event.target.value))} />
                </Field>
                <Field label={text.arabicName} error={adminErrorText(form.formState.errors.name?.ar?.message, text)}>
                  <Input dir="rtl" {...form.register("name.ar")} />
                </Field>
                <Field label={text.kurdishName} error={adminErrorText(form.formState.errors.name?.ckb?.message, text)}>
                  <Input dir="rtl" {...form.register("name.ckb")} />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label={text.englishDescription}>
                  <Textarea {...form.register("description.en")} />
                </Field>
                <Field label={text.arabicDescription}>
                  <Textarea dir="rtl" {...form.register("description.ar")} />
                </Field>
                <Field label={text.kurdishDescription}>
                  <Textarea dir="rtl" {...form.register("description.ckb")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={text.slug} error={adminErrorText(form.formState.errors.slug?.message, text)}>
                  <Input {...form.register("slug")} />
                </Field>
                <Field label={text.displayOrder}>
                  <Input type="number" {...form.register("displayOrder")} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>{saving ? text.saving : text.saveCategory}</Button>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>{text.cancel}</Button>
              </div>
            </form>
            <CategoryAdminPreview
              category={watchedCategory}
              itemCount={data?.menuItems.filter((item) => item.categoryId === watchedCategory.id).length || 0}
              locale={locale}
              text={text}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <Input placeholder={text.searchCategories} value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">{text.all}</option>
            <option value="active">{text.active}</option>
            <option value="inactive">{text.inactive}</option>
          </Select>
        </div>
        <div className="grid gap-3">
          {categories.map((category) => {
            const expanded = expandedCategoryId === category.id;
            const itemCount = data?.menuItems.filter((item) => item.categoryId === category.id).length || 0;
            const statusSaving = statusSavingIds.includes(category.id);
            return (
              <Card key={category.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-5 transition-colors hover:bg-muted/50">
                  <button
                    type="button"
                    className="focus-ring flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md text-start"
                    aria-expanded={expanded}
                    onClick={() => setExpandedCategoryId((current) => (current === category.id ? null : category.id))}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{localized(category.name, locale, category.name.en)}</p>
                      <p className="text-sm text-muted-foreground">{category.name.en} / {category.name.ar} / {category.name.ckb}</p>
                      <p className="text-xs text-muted-foreground">
                        {text.order} {category.displayOrder} · {itemCount} {text.menuItems}
                      </p>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} aria-hidden />
                  </button>
                  <div className="flex shrink-0 items-center gap-2 rounded-md border bg-background px-3 py-2">
                    <span className={cn("text-xs font-semibold", category.isActive ? "text-primary" : "text-muted-foreground")}>
                      {category.isActive ? text.active : text.inactive}
                    </span>
                    <Switch
                      label={`${text.active}: ${localized(category.name, locale, category.name.en)}`}
                      checked={category.isActive}
                      disabled={statusSaving}
                      onCheckedChange={(checked) => toggleCategoryActive(category, checked)}
                    />
                  </div>
                </div>
                {expanded ? (
                  <CardContent className="settings-panel border-t pt-5">
                    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
                      <CategoryAdminPreview category={category} itemCount={itemCount} locale={locale} text={text} />
                      <div className="flex flex-wrap content-start gap-2">
                        <Button type="button" variant="outline" size="icon" aria-label={text.edit} title={text.edit} onClick={() => edit(category)}>
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button type="button" variant="destructive" size="icon" aria-label={text.delete} title={text.delete} onClick={() => setDeleteTarget(category)}>
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
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

function CategoryAdminPreview({
  category,
  itemCount,
  locale,
  text
}: {
  category: CategoryFormData | Category;
  itemCount: number;
  locale: Locale;
  text: Record<string, string>;
}) {
  const title = localized(category.name, locale, category.name.en || text.category);
  const description = localized(category.description, locale);
  const slug = category.slug || slugify(category.name.en);

  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <p className="mb-3 text-sm font-medium">{text.preview}</p>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="bg-gradient-to-br from-accent via-primary/10 to-secondary/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold leading-tight">{title}</h3>
              {description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{description}</p> : null}
            </div>
            <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", category.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {category.isActive ? text.active : text.inactive}
            </span>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border bg-background px-2.5 py-1">{text.slug}: {slug || "-"}</span>
            <span className="rounded-full border bg-background px-2.5 py-1">{text.order} {category.displayOrder}</span>
            <span className="rounded-full border bg-background px-2.5 py-1">{itemCount} {text.menuItems}</span>
          </div>
          <div className="grid gap-2">
            {[0, 1].map((index) => (
              <div key={index} className="flex items-center justify-between rounded-md border bg-background p-3">
                <div className="space-y-1">
                  <div className="h-2.5 w-24 rounded-full bg-primary/20" />
                  <div className="h-2 w-32 rounded-full bg-muted" />
                </div>
                <div className="h-7 w-16 rounded-full bg-secondary/15" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function replaceCategory(data: AppData | null, category: Category): AppData | null {
  if (!data) return data;
  return {
    ...data,
    categories: data.categories.map((entry) => (entry.id === category.id ? category : entry))
  };
}
