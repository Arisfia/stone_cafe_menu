import { cn } from "@/lib/utils/cn";

// The agency that builds & maintains this app. Centralized here so the credit
// reads the same everywhere (menu footer, welcome screen, admin login, receipt)
// and can be renamed in one place later.
export const BRAND_AGENCY = "flan Agency";

// Subtle "Powered by <agency>" credit. Color is inherited, so pass a text-* class
// via `className` to recolor it on tinted backgrounds (e.g. the welcome screen).
export function BrandCredit({ className }: { className?: string }) {
  return (
    <p dir="ltr" className={cn("text-center text-xs text-muted-foreground", className)}>
      Powered by <span className="font-semibold">{BRAND_AGENCY}</span>
    </p>
  );
}
