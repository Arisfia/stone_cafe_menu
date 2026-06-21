import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localized, translate } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/utils/format";
import type { Category, Locale, MenuItem, MenuSettings } from "@/types/models";

export function MenuItemCard({
  item,
  category,
  locale,
  settings
}: {
  item: MenuItem;
  category?: Category;
  locale: Locale;
  settings: MenuSettings;
}) {
  const title = localized(item.name, locale);
  const description = localized(item.description, locale);

  return (
    <article className="grid overflow-hidden rounded-lg border bg-card shadow-sm sm:grid-cols-[180px_1fr]">
      {settings.showImages ? (
        <div className="flex min-h-40 items-center justify-center bg-gradient-to-br from-primary/15 via-accent/30 to-secondary/15">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="px-4 text-center text-sm font-medium text-muted-foreground">{title}</span>
          )}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">{title}</h3>
            {category ? <p className="text-xs text-muted-foreground">{localized(category.name, locale)}</p> : null}
          </div>
          {settings.showPrices ? (
            <div className="text-end">
              {item.discountPrice ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground line-through">
                    {formatMoney(item.basePrice, item.currency, locale)}
                  </p>
                  <p className="font-semibold text-secondary">{formatMoney(item.discountPrice, item.currency, locale)}</p>
                </div>
              ) : (
                <p className="font-semibold text-primary">{formatMoney(item.basePrice, item.currency, locale)}</p>
              )}
            </div>
          ) : null}
        </div>
        {description ? <p className="line-clamp-3 text-sm text-muted-foreground">{description}</p> : null}
        <div className="flex flex-wrap gap-2">
          {item.isSoldOut ? <Badge className="border-destructive text-destructive">{translate(locale, "menu.soldOut")}</Badge> : null}
          {item.isFeatured ? <Badge>{translate(locale, "menu.featured")}</Badge> : null}
          {item.isPopular ? <Badge>{translate(locale, "menu.popular")}</Badge> : null}
          {item.isNew ? <Badge>{translate(locale, "menu.new")}</Badge> : null}
          {item.dietaryLabels.map((label) => (
            <Badge key={label} className="bg-muted">
              {label}
            </Badge>
          ))}
          {settings.showAllergens && item.allergens.length ? <Badge className="border-accent">Allergens: {item.allergens.join(", ")}</Badge> : null}
        </div>
        <div className="mt-auto">
          <Button asChild variant="outline" size="sm">
            <Link href={`/menu/item/${item.id}`}>{translate(locale, "menu.viewDetails")}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
