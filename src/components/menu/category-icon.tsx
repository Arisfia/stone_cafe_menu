import { type CSSProperties } from "react";
import {
  CakeSlice,
  CupSoda,
  LayoutGrid,
  Sandwich,
  Utensils,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Each category icon gets its own looping motion. Breakfast, hot drinks, main
// meals, special offers and coffee use purpose-built animated SVGs; the rest
// reuse Lucide icons with a transform animation. All motion is disabled under
// prefers-reduced-motion (see globals.css).
const SLUG_ICON: Record<string, { Icon: LucideIcon; anim: string }> = {
  "cold-drinks": { Icon: CupSoda, anim: "cat-shake" },
  desserts: { Icon: CakeSlice, anim: "cat-bob" },
  sandwiches: { Icon: Sandwich, anim: "cat-bob" },
  all: { Icon: LayoutGrid, anim: "cat-sway" }
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  if (slug === "breakfast") return <FriedEggIcon className={className} />;
  if (slug === "hot-drinks") return <HotDrinkIcon className={className} />;
  if (slug === "main-meals") return <MainMealsIcon className={className} />;
  if (slug === "special-offers") return <SpecialOfferIcon className={className} />;
  if (slug === "coffee") return <CoffeeDustIcon className={className} />;

  const entry = SLUG_ICON[slug] ?? { Icon: Utensils, anim: "cat-wiggle" };
  const Icon = entry.Icon;
  return <Icon className={cn(entry.anim, className)} aria-hidden />;
}

function FriedEggIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      <g className="cat-egg-jelly">
        <path
          d="M11 5C15 5 18 7 18.4 10.5C18.8 14 16.5 17.6 13 18C9.5 18.4 5.4 17 4.6 13.5C3.8 10 5 6.6 8 5.5C9 5.1 10 5 11 5Z"
          fill="currentColor"
          opacity="0.16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle className="cat-yolk" cx="11.3" cy="11.8" r="3" fill="currentColor" />
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

function MainMealsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      {/* fork */}
      <g className="cat-fork" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M6 3.5v4M8 3.5v4M10 3.5v4" />
        <path d="M6 7.5h4" />
        <path d="M8 7.5V21" />
      </g>
      {/* knife */}
      <g className="cat-cut">
        <path d="M16 3.5C18.4 5.5 18.4 10 16 13Z" fill="currentColor" opacity="0.16" />
        <path d="M16 3.5C18.4 5.5 18.4 10 16 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 13v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  );
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

const COFFEE_DUST = [
  { dx: "6px", dy: "-6px", delay: "0s" },
  { dx: "-6px", dy: "-5px", delay: "0.06s" },
  { dx: "7px", dy: "4px", delay: "0.12s" },
  { dx: "-7px", dy: "5px", delay: "0.04s" },
  { dx: "0px", dy: "-8px", delay: "0.1s" },
  { dx: "2px", dy: "8px", delay: "0.15s" }
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
            cy="12"
            r="1.1"
            style={{ "--dx": dust.dx, "--dy": dust.dy, animationDelay: dust.delay } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  );
}
