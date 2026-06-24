"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BadgePercent,
  Bean,
  CakeSlice,
  CircleCheck,
  Clock,
  Coffee,
  CupSoda,
  Egg,
  Flame,
  LayoutGrid,
  MapPin,
  Phone,
  Sandwich,
  Search,
  Utensils,
  UtensilsCrossed,
  X,
  type LucideIcon
} from "lucide-react";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { LanguageGlobe } from "@/components/menu/language-globe";
import { MenuBackground } from "@/components/menu/menu-background";
import { ThemeToggle } from "@/components/menu/theme-toggle";
import { FallbackMenuImage } from "@/components/menu/fallback-menu-image";
import { defaultAppData } from "@/data/default-data";
import { getPublicAppData } from "@/lib/firebase/firestore";
import { localized, translate } from "@/lib/i18n/config";
import { formatMoney, normalizeSearch } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/hooks/use-locale";
import type { AppData, Category, Locale, MenuItem, MenuSettings } from "@/types/models";

export function MenuApp({
  initialCategorySlug
}: {
  initialCategorySlug?: string;
}) {
  const { locale, setLocale, dir: textDir } = useLocale(defaultAppData.general.defaultLanguage, {
    documentDirection: "ltr"
  });
  const [data, setData] = useState<AppData>(defaultAppData);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
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

  useEffect(() => {
    if (!activeItem) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveItem(null);
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [activeItem]);

  const visibleItems = useMemo(() => {
    const normalized = normalizeSearch(query);
    return data.menuItems
      .filter((item) => data.menu.showSoldOutItems || !item.isSoldOut)
      .filter((item) => categoryId === "all" || item.categoryId === categoryId)
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
  }, [categoryId, data, query]);

  const restaurantName = localized(data.general.restaurantName, locale);
  const description = localized(data.general.description, locale);
  const logoUrl = data.general.logoUrl;

  return (
    <main dir="ltr" className="relative min-h-screen">
      <MenuBackground />
      {/* Branded header */}
      <header className="relative overflow-hidden border-b bg-gradient-to-b from-accent/55 via-card/95 to-card/90 backdrop-blur-sm">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="container relative grid gap-5 py-7">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-md ring-1 ring-primary/20 sm:h-16 sm:w-16 sm:text-xl">
                {logoUrl ? (
                  <Image src={logoUrl} alt={restaurantName} width={64} height={64} className="h-full w-full object-cover" priority />
                ) : (
                  restaurantName.slice(0, 2)
                )}
              </div>
              <div className="min-w-0" dir={textDir}>
                <h1 className="truncate text-xl font-bold sm:text-3xl">{restaurantName}</h1>
                <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <ThemeToggle />
              <LanguageGlobe locale={locale} onChange={setLocale} />
            </div>
          </div>

          <div className="flex max-w-full flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">
              <CircleCheck className="h-4 w-4" aria-hidden />
              <span dir={textDir}>{translate(locale, "menu.available")}</span>
            </span>
            {data.general.phone ? (
              <a className="focus-ring inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-3 py-1.5 transition-colors hover:bg-muted" href={`tel:${data.general.phone}`}>
                <Phone className="h-4 w-4 text-primary" aria-hidden />
                <span className="truncate">{data.general.phone}</span>
              </a>
            ) : null}
            {data.general.whatsapp ? (
              <a className="focus-ring inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-3 py-1.5 transition-colors hover:bg-muted" href={`https://wa.me/${data.general.whatsapp.replace(/\D/g, "")}`} target="_blank">
                <WhatsappIcon className="h-4 w-4 text-primary" aria-hidden />
                <span dir={textDir}>{translate(locale, "menu.whatsapp")}</span>
              </a>
            ) : null}
            {data.general.googleMapsUrl ? (
              <a className="focus-ring inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-3 py-1.5 transition-colors hover:bg-muted" href={data.general.googleMapsUrl} target="_blank">
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
                <span dir={textDir}>{translate(locale, "menu.openMaps")}</span>
              </a>
            ) : null}
          </div>

          {data.menu.enableSearch ? (
            <label className="relative block max-w-2xl">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                className="h-12 rounded-full ps-10"
                dir={textDir}
                placeholder={translate(locale, "menu.search")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          ) : null}
        </div>
      </header>

      {/* Sticky category pills */}
      <nav className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryPill active={categoryId === "all"} onClick={() => setCategoryId("all")} Icon={LayoutGrid} textDir={textDir}>
            {translate(locale, "menu.all")}
          </CategoryPill>
          {data.categories.map((category) => (
            <CategoryPill
              key={category.id}
              active={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
              Icon={categoryIcon(category.slug)}
              textDir={textDir}
            >
              {localized(category.name, locale)}
            </CategoryPill>
          ))}
        </div>
      </nav>

      <section className="container grid gap-6 py-6">
        {error ? (
          <p dir={textDir} className="rounded-2xl border border-destructive bg-destructive/5 p-4 text-destructive">
            {error}
          </p>
        ) : null}

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
                onViewDetails={setActiveItem}
              />
            ))}
          </div>
        )}

        {!loading && !visibleItems.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <p dir={textDir} className="text-muted-foreground">
              {translate(locale, "menu.empty")}
            </p>
          </div>
        ) : null}
      </section>

      {activeItem ? (
        <MenuItemDetailModal
          item={activeItem}
          category={data.categories.find((category) => category.id === activeItem.categoryId)}
          settings={data.menu}
          restaurantName={restaurantName}
          whatsapp={data.general.whatsapp}
          locale={locale}
          textDir={textDir}
          onClose={() => setActiveItem(null)}
        />
      ) : null}
    </main>
  );
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  breakfast: Egg,
  "hot-drinks": Coffee,
  "cold-drinks": CupSoda,
  coffee: Bean,
  desserts: CakeSlice,
  sandwiches: Sandwich,
  "main-meals": UtensilsCrossed,
  "special-offers": BadgePercent
};

function categoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? Utensils;
}

function CategoryPill({
  active,
  onClick,
  children,
  Icon,
  textDir
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  Icon: LucideIcon;
  textDir: "ltr" | "rtl";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span dir={textDir}>{children}</span>
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

function MenuItemDetailModal({
  item,
  category,
  settings,
  restaurantName,
  whatsapp,
  locale,
  textDir,
  onClose
}: {
  item: MenuItem;
  category?: Category;
  settings: MenuSettings;
  restaurantName: string;
  whatsapp?: string;
  locale: Locale;
  textDir: "ltr" | "rtl";
  onClose: () => void;
}) {
  const title = localized(item.name, locale);
  const description = localized(item.description, locale);
  const ingredients = localized(item.ingredients, locale);
  const hasDiscount = Boolean(item.discountPrice);
  const variants = item.variants.filter((variant) => variant.isAvailable);
  const whatsappDigits = whatsapp?.replace(/\D/g, "");

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-background/60 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center">
        <article
          className="pop-in relative max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-card shadow-2xl sm:max-h-none sm:overflow-hidden sm:rounded-3xl"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={translate(locale, "menu.backToMenu")}
            className="absolute right-3 top-3 z-10 rounded-full bg-card/90 shadow-sm backdrop-blur sm:right-4 sm:top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>

          {settings.showImages ? (
            <div className="group relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-accent via-primary/5 to-secondary/10 sm:aspect-[16/10]">
              <FallbackMenuImage src={item.imageUrl} alt={title} />
              <div className="absolute inset-x-4 top-4 flex flex-wrap gap-1.5 pr-12">
                {item.isNew ? <DetailPill tone="primary">{translate(locale, "menu.new")}</DetailPill> : null}
                {item.isPopular ? <DetailPill tone="secondary">{translate(locale, "menu.popular")}</DetailPill> : null}
                {item.isFeatured ? <DetailPill tone="accent">{translate(locale, "menu.featured")}</DetailPill> : null}
              </div>
              {item.isSoldOut ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/65 backdrop-blur-[2px]">
                  <span className="rounded-full border border-destructive bg-background/90 px-5 py-2 text-base font-semibold text-destructive">
                    {translate(locale, "menu.soldOut")}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-7">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:gap-4">
              <div className="min-w-0" dir={textDir}>
                {category ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{localized(category.name, locale)}</p>
                ) : null}
                <h2 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
              </div>
              {settings.showPrices ? (
                <div className="flex flex-col items-start sm:items-end">
                  {hasDiscount ? (
                    <>
                      <span className="text-2xl font-bold text-secondary sm:text-3xl">
                        {formatMoney(item.discountPrice as number, item.currency, locale)}
                      </span>
                      <span className="text-base text-muted-foreground line-through">
                        {formatMoney(item.basePrice, item.currency, locale)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-primary sm:text-3xl">{formatMoney(item.basePrice, item.currency, locale)}</span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {item.preparationMinutes ? (
                <DetailChip>
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  <span dir={textDir}>
                    {item.preparationMinutes} {translate(locale, "menu.min")}
                  </span>
                </DetailChip>
              ) : null}
              {settings.showCalories && item.calories ? (
                <DetailChip>
                  <span dir={textDir}>
                    {item.calories} {translate(locale, "menu.kcal")}
                  </span>
                </DetailChip>
              ) : null}
              {item.spicyLevel && item.spicyLevel > 0 ? (
                <DetailChip>
                  <Flame className="h-3.5 w-3.5" aria-hidden />
                  <span dir={textDir}>{translate(locale, "menu.spicy")}</span>
                </DetailChip>
              ) : null}
              {item.dietaryLabels.map((label) => (
                <DetailChip key={label}>
                  <span dir={textDir}>{detailDietaryLabel(locale, label)}</span>
                </DetailChip>
              ))}
            </div>

            {description ? (
              <p dir={textDir} className="text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}

            {settings.showIngredients && ingredients ? (
              <DetailSection title={translate(locale, "menu.ingredients")} textDir={textDir}>
                <p dir={textDir} className="text-sm text-muted-foreground">
                  {ingredients}
                </p>
              </DetailSection>
            ) : null}

            {settings.showAllergens && item.allergens.length ? (
              <DetailSection title={translate(locale, "menu.allergens")} textDir={textDir}>
                <div className="flex flex-wrap gap-2">
                  {item.allergens.map((allergen) => (
                    <span key={allergen} className="inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-sm text-muted-foreground">
                      {allergen}
                    </span>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            {variants.length > 1 ? (
              <DetailSection title={translate(locale, "menu.options")} textDir={textDir}>
                <ul className="divide-y rounded-2xl border">
                  {variants.map((variant) => (
                    <li key={variant.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span dir={textDir} className="text-sm font-medium">
                        {localized(variant.name, locale)}
                      </span>
                      {settings.showPrices ? (
                        <span className="text-sm font-semibold text-primary">{formatMoney(variant.price, item.currency, locale)}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </DetailSection>
            ) : null}

            {whatsappDigits ? (
              <a
                href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`${restaurantName} - ${title}`)}`}
                target="_blank"
                className="focus-ring mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                <WhatsappIcon className="h-5 w-5" aria-hidden />
                <span dir={textDir}>{translate(locale, "menu.orderWhatsapp")}</span>
              </a>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
  textDir
}: {
  title: string;
  children: React.ReactNode;
  textDir: "ltr" | "rtl";
}) {
  return (
    <div className="space-y-2">
      <h3 dir={textDir} className="text-sm font-semibold uppercase tracking-wide text-foreground/80">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

function detailDietaryLabel(locale: Locale, label: string) {
  const map: Record<string, string> = {
    vegetarian: "menu.vegetarian",
    vegan: "menu.vegan",
    "gluten-free": "menu.glutenFree",
    "sugar-free": "menu.sugarFree"
  };
  return map[label] ? translate(locale, map[label]) : label;
}

function DetailPill({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "secondary" | "accent" }) {
  const tones = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    accent: "bg-accent text-accent-foreground"
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm", tones[tone])}>
      {children}
    </span>
  );
}
