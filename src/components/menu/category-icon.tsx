import { type CSSProperties } from "react";
import {
  CakeSlice,
  CupSoda,
  LayoutGrid,
  Sandwich,
  Utensils,
  UtensilsCrossed,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Each category icon gets its own looping motion. Breakfast, hot drinks, coffee
// and special offers use purpose-built animated SVGs; the rest reuse Lucide
// icons with a transform animation. All motion is disabled under
// prefers-reduced-motion (see globals.css).
const SLUG_ICON: Record<string, { Icon: LucideIcon; anim: string }> = {
  "cold-drinks": { Icon: CupSoda, anim: "cat-shake" },
  desserts: { Icon: CakeSlice, anim: "cat-bob" },
  sandwiches: { Icon: Sandwich, anim: "cat-bob" },
  "main-meals": { Icon: UtensilsCrossed, anim: "cat-wiggle" },
  all: { Icon: LayoutGrid, anim: "cat-sway" }
};

// Matched loosely so an offers/discount category is detected whatever its exact
// slug ends up being (special-offers, offers, discount, deals, promo, sale...).
function isOfferSlug(slug: string) {
  return /offer|discount|deal|promo|sale/i.test(slug);
}

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  if (slug === "breakfast") return <BoilingEggIcon className={className} />;
  if (slug === "hot-drinks") return <HotDrinkIcon className={className} />;
  if (slug === "coffee") return <CoffeeDustIcon className={className} />;
  if (isOfferSlug(slug)) return <SpecialOfferIcon className={className} />;

  const entry = SLUG_ICON[slug] ?? { Icon: Utensils, anim: "cat-wiggle" };
  const Icon = entry.Icon;
  return <Icon className={cn(entry.anim, className)} aria-hidden />;
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
        <line x1="9" y1="15" x2="15" y2="9" />
        <circle cx="9.4" cy="9.4" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="14.6" cy="14.6" r="1.3" fill="currentColor" stroke="none" />
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
