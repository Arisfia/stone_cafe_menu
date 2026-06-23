"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Flame, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/menu/theme-toggle";
import { LanguageGlobe } from "@/components/menu/language-globe";
import { MenuBackground } from "@/components/menu/menu-background";
import { FallbackMenuImage } from "@/components/menu/fallback-menu-image";
import { defaultAppData } from "@/data/default-data";
import { getPublicAppData } from "@/lib/firebase/firestore";
import { localized, translate } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/hooks/use-locale";
import type { AppData, Locale } from "@/types/models";

export function MenuItemDetail({ itemId }: { itemId: string }) {
  const { locale, setLocale, dir } = useLocale(defaultAppData.general.defaultLanguage);
  const [data, setData] = useState<AppData>(defaultAppData);
  const [loading, setLoading] = useState(true);
  // Back points "against" the reading direction.
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  useEffect(() => {
    getPublicAppData()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const item = useMemo(() => data.menuItems.find((entry) => entry.id === itemId), [data.menuItems, itemId]);
  const category = useMemo(
    () => (item ? data.categories.find((entry) => entry.id === item.categoryId) : undefined),
    [data.categories, item]
  );

  const settings = data.menu;
  const title = item ? localized(item.name, locale) : "";
  const description = item ? localized(item.description, locale) : "";
  const ingredients = item ? localized(item.ingredients, locale) : "";
  const hasDiscount = Boolean(item?.discountPrice);
  const variants = (item?.variants || []).filter((variant) => variant.isAvailable);
  const whatsappDigits = data.general.whatsapp?.replace(/\D/g, "");

  return (
    <main dir={dir} className="relative min-h-screen">
      <MenuBackground />

      <header className="container flex items-center justify-between gap-3 py-5">
        <Link
          href="/menu"
          className="focus-ring inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
        >
          <BackArrow className="h-4 w-4" aria-hidden />
          {translate(locale, "menu.backToMenu")}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageGlobe locale={locale} onChange={setLocale} />
        </div>
      </header>

      <section className="container max-w-3xl pb-16">
        {loading ? (
          <DetailSkeleton showImage={settings.showImages} />
        ) : !item ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
            <p className="text-muted-foreground">{translate(locale, "menu.itemNotFound")}</p>
            <Link href="/menu" className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              <BackArrow className="h-4 w-4" aria-hidden />
              {translate(locale, "menu.backToMenu")}
            </Link>
          </div>
        ) : (
          <article className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            {settings.showImages ? (
              <div className="group relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-accent via-primary/5 to-secondary/10">
                <FallbackMenuImage src={item.imageUrl} alt={title} />
                <div className="absolute inset-x-4 top-4 flex flex-wrap gap-1.5">
                  {item.isNew ? <Pill tone="primary">{translate(locale, "menu.new")}</Pill> : null}
                  {item.isPopular ? <Pill tone="secondary">{translate(locale, "menu.popular")}</Pill> : null}
                  {item.isFeatured ? <Pill tone="accent">{translate(locale, "menu.featured")}</Pill> : null}
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

            <div className="flex flex-col gap-6 p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  {category ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{localized(category.name, locale)}</p>
                  ) : null}
                  <h1 className="mt-1 text-3xl font-bold leading-tight">{title}</h1>
                </div>
                {settings.showPrices ? (
                  <div className="flex flex-col items-end">
                    {hasDiscount ? (
                      <>
                        <span className="text-3xl font-bold text-secondary">
                          {formatMoney(item.discountPrice as number, item.currency, locale)}
                        </span>
                        <span className="text-base text-muted-foreground line-through">
                          {formatMoney(item.basePrice, item.currency, locale)}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-primary">{formatMoney(item.basePrice, item.currency, locale)}</span>
                    )}
                  </div>
                ) : null}
              </div>

              {/* meta chips */}
              <div className="flex flex-wrap gap-2">
                {item.preparationMinutes ? (
                  <Chip>
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {item.preparationMinutes} {translate(locale, "menu.min")}
                  </Chip>
                ) : null}
                {settings.showCalories && item.calories ? (
                  <Chip>
                    {item.calories} {translate(locale, "menu.kcal")}
                  </Chip>
                ) : null}
                {item.spicyLevel && item.spicyLevel > 0 ? (
                  <Chip>
                    <Flame className="h-3.5 w-3.5" aria-hidden />
                    {translate(locale, "menu.spicy")}
                  </Chip>
                ) : null}
                {item.dietaryLabels.map((label) => (
                  <Chip key={label}>{dietaryLabel(locale, label)}</Chip>
                ))}
              </div>

              {description ? <p className="text-base leading-relaxed text-muted-foreground">{description}</p> : null}

              {settings.showIngredients && ingredients ? (
                <Section title={translate(locale, "menu.ingredients")}>
                  <p className="text-sm text-muted-foreground">{ingredients}</p>
                </Section>
              ) : null}

              {settings.showAllergens && item.allergens.length ? (
                <Section title={translate(locale, "menu.allergens")}>
                  <div className="flex flex-wrap gap-2">
                    {item.allergens.map((allergen) => (
                      <span key={allergen} className="inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-sm text-muted-foreground">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </Section>
              ) : null}

              {variants.length > 1 ? (
                <Section title={translate(locale, "menu.options")}>
                  <ul className="divide-y rounded-2xl border">
                    {variants.map((variant) => (
                      <li key={variant.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-sm font-medium">{localized(variant.name, locale)}</span>
                        {settings.showPrices ? (
                          <span className="text-sm font-semibold text-primary">{formatMoney(variant.price, item.currency, locale)}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {whatsappDigits ? (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`${localized(data.general.restaurantName, locale)} — ${title}`)}`}
                  target="_blank"
                  className="focus-ring mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  {translate(locale, "menu.orderWhatsapp")}
                </a>
              ) : null}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/80">{title}</h2>
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

function dietaryLabel(locale: Locale, label: string) {
  const map: Record<string, string> = {
    vegetarian: "menu.vegetarian",
    vegan: "menu.vegan",
    "gluten-free": "menu.glutenFree",
    "sugar-free": "menu.sugarFree"
  };
  return map[label] ? translate(locale, map[label]) : label;
}

function Pill({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "secondary" | "accent" }) {
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

function DetailSkeleton({ showImage }: { showImage: boolean }) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      {showImage ? <div className="aspect-[16/10] animate-pulse bg-muted" /> : null}
      <div className="space-y-4 p-7">
        <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
