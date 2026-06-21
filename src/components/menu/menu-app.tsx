"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { LanguageSelector } from "@/components/menu/language-selector";
import { ThemeToggle } from "@/components/menu/theme-toggle";
import { defaultAppData } from "@/data/default-data";
import { getPublicAppData } from "@/lib/firebase/firestore";
import { localized, translate } from "@/lib/i18n/config";
import { normalizeSearch } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/hooks/use-locale";
import type { AppData, MenuItem } from "@/types/models";

export function MenuApp({
  initialCategorySlug,
  initialItemId
}: {
  initialCategorySlug?: string;
  initialItemId?: string;
}) {
  const { locale, setLocale, dir } = useLocale(defaultAppData.general.defaultLanguage);
  const [data, setData] = useState<AppData>(defaultAppData);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "featured" | "popular" | "new" | "vegetarian" | "spicy">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicAppData()
      .then((next) => {
        setData(next);
        const initialCategory = next.categories.find((category) => category.slug === initialCategorySlug);
        if (initialCategory) setCategoryId(initialCategory.id);
      })
      .catch(() => setError(translate(locale, "menu.menuUnavailable")))
      .finally(() => setLoading(false));
  }, [initialCategorySlug, locale]);

  const selectedItem = useMemo(() => data.menuItems.find((item) => item.id === initialItemId), [data.menuItems, initialItemId]);

  const visibleItems = useMemo(() => {
    const normalized = normalizeSearch(query);
    return data.menuItems
      .filter((item) => data.menu.showSoldOutItems || !item.isSoldOut)
      .filter((item) => categoryId === "all" || item.categoryId === categoryId)
      .filter((item) => matchFilter(item, filter))
      .filter((item) => {
        if (!normalized) return true;
        const category = data.categories.find((entry) => entry.id === item.categoryId);
        const haystack = [
          ...Object.values(item.name),
          ...Object.values(item.description || {}),
          ...Object.values(item.ingredients || {}),
          ...item.tags,
          ...(category ? Object.values(category.name) : [])
        ]
          .map(normalizeSearch)
          .join(" ");
        return haystack.includes(normalized);
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categoryId, data, filter, query]);

  const restaurantName = localized(data.general.restaurantName, locale);
  const description = localized(data.general.description, locale);

  return (
    <main dir={dir} className="min-h-screen bg-background">
      <section className="border-b bg-card">
        <div className="container grid gap-5 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
                {restaurantName.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold">{restaurantName}</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <LanguageSelector locale={locale} onChange={setLocale} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge>{translate(locale, "menu.available")}</Badge>
            {data.general.phone ? (
              <a className="focus-ring inline-flex items-center gap-2 rounded-md border px-3 py-2" href={`tel:${data.general.phone}`}>
                <Phone className="h-4 w-4" aria-hidden />
                {data.general.phone}
              </a>
            ) : null}
            {data.general.whatsapp ? (
              <a className="focus-ring inline-flex items-center gap-2 rounded-md border px-3 py-2" href={`https://wa.me/${data.general.whatsapp.replace(/\D/g, "")}`}>
                {translate(locale, "menu.whatsapp")}
              </a>
            ) : null}
            {data.general.googleMapsUrl ? (
              <a className="focus-ring inline-flex items-center gap-2 rounded-md border px-3 py-2" href={data.general.googleMapsUrl} target="_blank">
                <MapPin className="h-4 w-4" aria-hidden />
                {translate(locale, "menu.openMaps")}
              </a>
            ) : null}
          </div>
          {data.menu.enableSearch ? (
            <label className="relative block max-w-2xl">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input className="ps-10" placeholder={translate(locale, "menu.search")} value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          ) : null}
        </div>
      </section>

      <section className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex gap-2 overflow-x-auto py-3">
          <Button variant={categoryId === "all" ? "default" : "outline"} size="sm" onClick={() => setCategoryId("all")}>
            {translate(locale, "menu.all")}
          </Button>
          {data.categories.map((category) => (
            <Button
              key={category.id}
              variant={categoryId === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryId(category.id)}
            >
              {localized(category.name, locale)}
            </Button>
          ))}
        </div>
      </section>

      <section className="container grid gap-6 py-6">
        {data.menu.enableFilters ? (
          <div className="flex flex-wrap gap-2">
            {(["all", "featured", "popular", "new", "vegetarian", "spicy"] as const).map((entry) => (
              <Button key={entry} size="sm" variant={filter === entry ? "secondary" : "outline"} onClick={() => setFilter(entry)}>
                {entry === "all" ? translate(locale, "menu.all") : translate(locale, `menu.${entry}`)}
              </Button>
            ))}
          </div>
        ) : null}

        {selectedItem ? (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
            <MenuItemCard
              item={selectedItem}
              category={data.categories.find((category) => category.id === selectedItem.categoryId)}
              locale={locale}
              settings={data.menu}
            />
          </div>
        ) : null}

        {error ? <p className="rounded-lg border border-destructive p-4 text-destructive">{error}</p> : null}
        {loading ? <p className="rounded-lg border p-4 text-muted-foreground">{translate(locale, "admin.loading")}...</p> : null}

        <div className={cn("grid gap-4", data.appearance.menuLayout === "grid" && "lg:grid-cols-2")}>
          {visibleItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              category={data.categories.find((category) => category.id === item.categoryId)}
              locale={locale}
              settings={data.menu}
            />
          ))}
        </div>
        {!loading && !visibleItems.length ? <p className="rounded-lg border p-6 text-center text-muted-foreground">{translate(locale, "menu.empty")}</p> : null}
      </section>
    </main>
  );
}

function matchFilter(item: MenuItem, filter: "all" | "featured" | "popular" | "new" | "vegetarian" | "spicy") {
  if (filter === "all") return true;
  if (filter === "featured") return item.isFeatured;
  if (filter === "popular") return item.isPopular;
  if (filter === "new") return item.isNew;
  if (filter === "vegetarian") return item.dietaryLabels.includes("vegetarian");
  if (filter === "spicy") return Boolean(item.spicyLevel && item.spicyLevel > 0);
  return true;
}
