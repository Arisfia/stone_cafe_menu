import {
  BadgePercent,
  Bean,
  CakeSlice,
  CupSoda,
  LayoutGrid,
  Sandwich,
  Utensils,
  UtensilsCrossed,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Each category icon gets its own looping motion. Breakfast and hot drinks use
// purpose-built SVGs (boiling egg + bubbles, mug + steam); the rest reuse Lucide
// icons with a transform animation. All motion is disabled under reduced-motion.
const SLUG_ICON: Record<string, { Icon: LucideIcon; anim: string }> = {
  "cold-drinks": { Icon: CupSoda, anim: "cat-shake" },
  coffee: { Icon: Bean, anim: "cat-spin" },
  desserts: { Icon: CakeSlice, anim: "cat-bob" },
  sandwiches: { Icon: Sandwich, anim: "cat-bob" },
  "main-meals": { Icon: UtensilsCrossed, anim: "cat-wiggle" },
  "special-offers": { Icon: BadgePercent, anim: "cat-pulse" },
  all: { Icon: LayoutGrid, anim: "cat-sway" }
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  if (slug === "breakfast") return <BoilingEggIcon className={className} />;
  if (slug === "hot-drinks") return <HotDrinkIcon className={className} />;

  const entry = SLUG_ICON[slug] ?? { Icon: Utensils, anim: "cat-wiggle" };
  const Icon = entry.Icon;
  return <Icon className={cn(entry.anim, className)} aria-hidden />;
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
