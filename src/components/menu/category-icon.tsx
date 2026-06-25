import { type CSSProperties, type ReactNode } from "react";
import {
  Cake,
  CakeSlice,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Donut,
  Flame,
  GlassWater,
  IceCreamCone,
  LayoutGrid,
  Martini,
  Milk,
  Salad,
  Sandwich,
  Star,
  Utensils,
  UtensilsCrossed,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Every category icon has its own looping motion, purpose-built to the subject:
// the egg boils, the flame flickers, the donut rolls, the leaf grows, etc.
// Bespoke SVGs (breakfast/hot drinks/coffee/special offer) animate their own
// parts; the rest are Lucide glyphs paired with a fitting transform animation.
// All motion is disabled under prefers-reduced-motion (see globals.css).

export type CategoryIconDef = {
  key: string;
  label: string;
  // Either a Lucide glyph + animation class, or a bespoke animated SVG component.
  Icon?: LucideIcon;
  anim?: string;
  Custom?: (props: { className?: string }) => ReactNode;
};

// Default icon for brand-new "Special N" categories: a star that pops + pulses.
export const DEFAULT_CATEGORY_ICON = "special";

export const CATEGORY_ICONS: CategoryIconDef[] = [
  { key: "special", label: "Special", Icon: Star, anim: "cat-star-pop" },
  { key: "special-offer", label: "Offer", Custom: SpecialOfferIcon },
  { key: "breakfast", label: "Breakfast", Custom: BoilingEggIcon },
  { key: "hot-drinks", label: "Hot drinks", Custom: HotDrinkIcon },
  { key: "coffee", label: "Coffee beans", Custom: CoffeeDustIcon },
  { key: "coffee-togo", label: "Coffee", Icon: Coffee, anim: "cat-warm" },
  { key: "cold-drinks", label: "Cold drinks", Icon: CupSoda, anim: "cat-shake" },
  { key: "juice", label: "Juice / water", Icon: GlassWater, anim: "cat-pour" },
  { key: "milkshake", label: "Milkshake", Icon: Milk, anim: "cat-shake" },
  { key: "mocktail", label: "Mocktail", Icon: Martini, anim: "cat-sway" },
  { key: "pastry", label: "Pastry", Icon: Croissant, anim: "cat-bob" },
  { key: "donut", label: "Donut", Icon: Donut, anim: "cat-roll" },
  { key: "cookie", label: "Cookie", Icon: Cookie, anim: "cat-spin" },
  { key: "cake", label: "Cake", Icon: Cake, anim: "cat-pulse" },
  { key: "ice-cream", label: "Ice cream", Icon: IceCreamCone, anim: "cat-drip" },
  { key: "desserts", label: "Desserts", Icon: CakeSlice, anim: "cat-bob" },
  { key: "sandwiches", label: "Sandwiches", Icon: Sandwich, anim: "cat-bob" },
  { key: "main-meals", label: "Main meals", Icon: UtensilsCrossed, anim: "cat-wiggle" },
  { key: "spicy", label: "Grill / spicy", Icon: Flame, anim: "cat-flicker" },
  { key: "diet", label: "Diet / healthy", Icon: Salad, anim: "cat-grow" },
  { key: "all", label: "All", Icon: LayoutGrid, anim: "cat-sway" },
  { key: "utensils", label: "Generic", Icon: Utensils, anim: "cat-wiggle" }
];

const ICON_MAP: Record<string, CategoryIconDef> = Object.fromEntries(CATEGORY_ICONS.map((def) => [def.key, def]));

// Legacy categories created before the icon field existed are matched by slug so
// their icons keep working without a re-save.
const SLUG_TO_KEY: Record<string, string> = {
  breakfast: "breakfast",
  "hot-drinks": "hot-drinks",
  coffee: "coffee",
  "cold-drinks": "cold-drinks",
  desserts: "desserts",
  sandwiches: "sandwiches",
  "main-meals": "main-meals",
  all: "all"
};

// Matched loosely so an offers/discount category is detected whatever its exact
// slug ends up being (special-offers, offers, discount, deals, promo, sale...).
function isOfferSlug(slug: string) {
  return /offer|discount|deal|promo|sale/i.test(slug);
}

function resolveIconKey(slug?: string, icon?: string): string {
  if (icon && ICON_MAP[icon]) return icon;
  if (slug && SLUG_TO_KEY[slug]) return SLUG_TO_KEY[slug];
  if (slug && isOfferSlug(slug)) return "special-offer";
  return "utensils";
}

export function CategoryIcon({ slug, icon, className }: { slug?: string; icon?: string; className?: string }) {
  const def = ICON_MAP[resolveIconKey(slug, icon)];
  if (def.Custom) {
    const Custom = def.Custom;
    return <Custom className={className} />;
  }
  const Icon = def.Icon ?? Utensils;
  return <Icon className={cn(def.anim, className)} aria-hidden />;
}

function SpecialOfferIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      <g transform="rotate(-90 12 12)">
        <circle
          className="cat-ring-draw"
          cx="12"
          cy="12"
          r="8.5"
          pathLength={100}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeDasharray="100"
          strokeLinecap="round"
        />
      </g>
      <g className="cat-percent-in" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="10" y1="14" x2="14" y2="10" />
        <circle cx="10.2" cy="10.2" r="1.15" fill="currentColor" stroke="none" />
        <circle cx="13.8" cy="13.8" r="1.15" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

function BoilingEggIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      <g fill="currentColor">
        <circle className="cat-bubble" cx="8" cy="7" r="1" style={{ animationDelay: "0s" }} />
        <circle className="cat-bubble" cx="12" cy="6" r="1.2" style={{ animationDelay: "0.5s" }} />
        <circle className="cat-bubble" cx="16" cy="7.5" r="0.9" style={{ animationDelay: "1s" }} />
      </g>
      <g className="cat-boil">
        <ellipse cx="12" cy="15" rx="6.4" ry="7" fill="currentColor" opacity="0.18" />
        <ellipse cx="12" cy="15" rx="6.4" ry="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="15.5" r="2.4" fill="currentColor" />
      </g>
    </svg>
  );
}

function HotDrinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
        <path className="cat-steam" style={{ animationDelay: "0s" }} d="M9 7c-1.2-1.4 1.2-2.4 0-3.8" />
        <path className="cat-steam" style={{ animationDelay: "0.8s" }} d="M13 7c-1.2-1.4 1.2-2.4 0-3.8" />
      </g>
      <path d="M4 10h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="currentColor" opacity="0.18" />
      <path d="M4 10h12v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 11h2a2.5 2.5 0 0 1 0 5h-2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

// Crumbs fall downward (and slightly outward), as if the bean is being shredded.
const COFFEE_DUST = [
  { dx: "-6px", dy: "8px", delay: "0s", r: 1.1 },
  { dx: "-4px", dy: "11px", delay: "0.05s", r: 0.8 },
  { dx: "-2px", dy: "9px", delay: "0.12s", r: 1.2 },
  { dx: "-1px", dy: "12px", delay: "0.18s", r: 0.7 },
  { dx: "1px", dy: "9px", delay: "0.03s", r: 1 },
  { dx: "2px", dy: "11px", delay: "0.22s", r: 0.9 },
  { dx: "3px", dy: "8px", delay: "0.08s", r: 1.2 },
  { dx: "5px", dy: "10px", delay: "0.14s", r: 0.8 },
  { dx: "6px", dy: "12px", delay: "0.1s", r: 1 },
  { dx: "0px", dy: "13px", delay: "0.26s", r: 0.7 },
  { dx: "-5px", dy: "13px", delay: "0.2s", r: 0.9 },
  { dx: "7px", dy: "9px", delay: "0.16s", r: 0.8 }
];

function CoffeeDustIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      <g className="cat-bean-crumble">
        <ellipse cx="12" cy="12" rx="5.5" ry="7.5" fill="currentColor" opacity="0.18" transform="rotate(20 12 12)" />
        <ellipse cx="12" cy="12" rx="5.5" ry="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(20 12 12)" />
        <path d="M9.5 6C12 10 12 14 9 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" transform="rotate(20 12 12)" />
      </g>
      <g fill="currentColor">
        {COFFEE_DUST.map((dust, index) => (
          <circle
            key={index}
            className="cat-dust"
            cx="12"
            cy="11"
            r={dust.r}
            style={{ "--dx": dust.dx, "--dy": dust.dy, animationDelay: dust.delay } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  );
}
