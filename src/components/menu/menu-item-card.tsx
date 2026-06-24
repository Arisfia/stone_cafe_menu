import { MousePointerClick } from "lucide-react";
import { dirForLocale, localized, translate } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/utils/format";
import { FallbackMenuImage } from "@/components/menu/fallback-menu-image";
import type { Locale, MenuItem, MenuSettings } from "@/types/models";

export function MenuItemCard({
  item,
  locale,
  settings,
  onViewDetails
}: {
  item: MenuItem;
  locale: Locale;
  settings: MenuSettings;
  onViewDetails?: (item: MenuItem) => void;
}) {
  const title = localized(item.name, locale);
  const description = localized(item.description, locale);
  const textDir = dirForLocale(locale);
  const hasDiscount = Boolean(item.discountPrice);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-accent via-primary/5 to-secondary/10">
        <FallbackMenuImage src={item.imageUrl} alt={title} />

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
          </div>
          {settings.showPrices ? (
            <div className="shrink-0 text-end">
              {hasDiscount ? (
                <>
                  <p className="text-xs text-muted-foreground line-through">
                    {formatMoney(item.basePrice, item.currency, locale)}
                  </p>
                  <p className="text-sm font-bold text-secondary">
                    {formatMoney(item.discountPrice as number, item.currency, locale)}
                  </p>
                </>
              ) : (
                <p className="text-sm font-bold text-primary">
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

        <div className="mt-auto pt-1">
          <button
            type="button"
            onClick={() => onViewDetails?.(item)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <span dir={textDir}>{translate(locale, "menu.viewDetails")}</span>
            <MousePointerClick className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
