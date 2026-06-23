import Link from "next/link";
import { ArrowRight, Clock, Flame } from "lucide-react";
import { dirForLocale, localized, translate } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { FallbackMenuImage } from "@/components/menu/fallback-menu-image";
import type { Category, Locale, MenuItem, MenuSettings } from "@/types/models";

export function MenuItemCard({
  item,
  category,
  locale,
  settings,
  featured = false
}: {
  item: MenuItem;
  category?: Category;
  locale: Locale;
  settings: MenuSettings;
  featured?: boolean;
}) {
  const title = localized(item.name, locale);
  const description = localized(item.description, locale);
  const textDir = dirForLocale(locale);
  const hasDiscount = Boolean(item.discountPrice);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
        featured && "border-primary/40 ring-1 ring-primary/20"
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-accent via-primary/5 to-secondary/10">
        <FallbackMenuImage src={item.imageUrl} alt={title} />

        <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
          {item.isNew ? <Pill tone="primary">{translate(locale, "menu.new")}</Pill> : null}
          {item.isPopular ? <Pill tone="secondary">{translate(locale, "menu.popular")}</Pill> : null}
          {item.isFeatured ? <Pill tone="accent">{translate(locale, "menu.featured")}</Pill> : null}
        </div>

        {item.isSoldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/65 backdrop-blur-[2px]">
            <span className="rounded-full border border-destructive bg-background/90 px-4 py-1.5 text-sm font-semibold text-destructive">
              {translate(locale, "menu.soldOut")}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0" dir={textDir}>
            <h3 className="text-lg font-semibold leading-tight">{title}</h3>
            {category ? (
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {localized(category.name, locale)}
              </p>
            ) : null}
          </div>
          {settings.showPrices ? (
            <div className="shrink-0 text-end">
              {hasDiscount ? (
                <>
                  <p className="text-xs text-muted-foreground line-through">
                    {formatMoney(item.basePrice, item.currency, locale)}
                  </p>
                  <p className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-bold text-secondary">
                    {formatMoney(item.discountPrice as number, item.currency, locale)}
                  </p>
                </>
              ) : (
                <p className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  {formatMoney(item.basePrice, item.currency, locale)}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {description ? (
          <p dir={textDir} className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          {item.spicyLevel && item.spicyLevel > 0 ? (
            <Pill tone="muted">
              <Flame className="h-3 w-3" aria-hidden />
              <span dir={textDir}>{translate(locale, "menu.spicy")}</span>
            </Pill>
          ) : null}
          {item.dietaryLabels.map((label) => (
            <Pill key={label} tone="muted">
              <span dir={textDir}>{dietaryLabel(locale, label)}</span>
            </Pill>
          ))}
          {settings.showAllergens && item.allergens.length ? (
            <Pill tone="outline">{item.allergens.join(", ")}</Pill>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Link
            href={`/menu/item/${item.id}`}
            className="focus-ring inline-flex items-center gap-1 rounded-md text-sm font-semibold text-primary transition-all hover:gap-2"
          >
            <span dir={textDir}>{translate(locale, "menu.viewDetails")}</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {item.preparationMinutes ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              <span dir={textDir}>
                {item.preparationMinutes} {translate(locale, "menu.min")}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </article>
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

function Pill({
  children,
  tone = "muted"
}: {
  children: React.ReactNode;
  tone?: "primary" | "secondary" | "accent" | "muted" | "outline" | "destructive";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    accent: "bg-accent text-accent-foreground",
    muted: "bg-muted text-muted-foreground",
    outline: "border border-border bg-background/70 text-muted-foreground",
    destructive: "bg-destructive text-destructive-foreground"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
