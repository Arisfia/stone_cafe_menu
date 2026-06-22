"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { MapPin, Phone, Search, Sparkles, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const logoUrl = data.general.logoUrl;

  return (
    <main dir={dir} className="min-h-screen bg-background">
      {/* Branded header */}
      <header className="relative overflow-hidden border-b bg-gradient-to-b from-accent/50 via-card to-card">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="container relative grid gap-5 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-md ring-1 ring-primary/20">
                {logoUrl ? (
                  <Image src={logoUrl} alt={restaurantName} width={64} height={64} className="h-full w-full object-cover" priority />
                ) : (
                  restaurantName.slice(0, 2)
                )}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">{restaurantName}</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <LanguageSelector locale={locale} onChange={setLocale} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
              {translate(locale, "menu.available")}
            </span>
            {data.general.phone ? (
              <a className="focus-ring inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 transition-colors hover:bg-muted" href={`tel:${data.general.phone}`}>
                <Phone className="h-4 w-4 text-primary" aria-hidden />
                {data.general.phone}
              </a>
            ) : null}
            {data.general.whatsapp ? (
              <a className="focus-ring inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 transition-colors hover:bg-muted" href={`https://wa.me/${data.general.whatsapp.replace(/\D/g, "")}`} target="_blank">
                {translate(locale, "menu.whatsapp")}
              </a>
            ) : null}
            {data.general.googleMapsUrl ? (
              <a className="focus-ring inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 transition-colors hover:bg-muted" href={data.general.googleMapsUrl} target="_blank">
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
                {translate(locale, "menu.openMaps")}
              </a>
            ) : null}
          </div>

          {data.menu.enableSearch ? (
            <label className="relative block max-w-2xl">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input className="h-12 rounded-full ps-10" placeholder={translate(locale, "menu.search")} value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          ) : null}
        </div>
      </header>

      {/* Sticky category pills */}
      <nav className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPill active={categoryId === "all"} onClick={() => setCategoryId("all")}>
            {translate(locale, "menu.all")}
          </CategoryPill>
          {data.categories.map((category) => (
            <CategoryPill key={category.id} active={categoryId === category.id} onClick={() => setCategoryId(category.id)}>
              {localized(category.name, locale)}
            </CategoryPill>
          ))}
        </div>
      </nav>

      <section className="container grid gap-6 py-6">
        {data.menu.enableFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {translate(locale, "menu.filters")}
            </span>
            {(["all", "featured", "popular", "new", "vegetarian", "spicy"] as const).map((entry) => (
              <Button
                key={entry}
                size="sm"
                variant={filter === entry ? "secondary" : "outline"}
                className="rounded-full"
                onClick={() => setFilter(entry)}
              >
                {entry === "all" ? translate(locale, "menu.all") : translate(locale, `menu.${entry}`)}
              </Button>
            ))}
          </div>
        ) : null}

        {selectedItem ? (
          <MenuItemCard
            item={selectedItem}
            category={data.categories.find((category) => category.id === selectedItem.categoryId)}
            locale={locale}
            settings={data.menu}
            featured
          />
        ) : null}

        {error ? <p className="rounded-2xl border border-destructive bg-destructive/5 p-4 text-destructive">{error}</p> : null}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} showImage={data.menu.showImages} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
        )}

        {!loading && !visibleItems.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <p className="text-muted-foreground">{translate(locale, "menu.empty")}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function CardSkeleton({ showImage }: { showImage: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {showImage ? <div className="aspect-[5/4] animate-pulse bg-muted" /> : null}
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
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
