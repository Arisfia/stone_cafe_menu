import { CakeSlice, Coffee, Croissant, CupSoda, GlassWater, Martini, Pizza, Sandwich } from "lucide-react";

// The same drifting coffee-shop animation as the welcome page, tuned softer so
// menu content stays readable. Rendered as a fixed layer behind the page so it
// stays put while the menu scrolls. Honors prefers-reduced-motion (globals.css).
export function MenuBackground() {
  const figures = [
    { Icon: Coffee, top: "8%", left: "5%", size: 34, delay: "0s", opacity: 0.14 },
    { Icon: Martini, top: "16%", left: "89%", size: 36, delay: "1.2s", opacity: 0.13 },
    { Icon: Croissant, top: "34%", left: "3%", size: 32, delay: "0.6s", opacity: 0.14 },
    { Icon: CupSoda, top: "44%", left: "94%", size: 30, delay: "1s", opacity: 0.13 },
    { Icon: CakeSlice, top: "62%", left: "6%", size: 32, delay: "2s", opacity: 0.14 },
    { Icon: Pizza, top: "70%", left: "91%", size: 34, delay: "0.4s", opacity: 0.13 },
    { Icon: Sandwich, top: "86%", left: "10%", size: 32, delay: "1.6s", opacity: 0.14 },
    { Icon: GlassWater, top: "90%", left: "85%", size: 28, delay: "2.4s", opacity: 0.13 }
  ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* light mint wash that ties to the welcome page */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/45 via-background to-accent/25 dark:from-[#0c1810] dark:via-background dark:to-[#0a140b]" />

      {/* drifting aroma blobs */}
      <div className="aroma-pan absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#A4D8A6]/30 blur-3xl dark:bg-[#A4D8A6]/10" />
      <div
        className="aroma-pan absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#c2ecc3]/35 blur-3xl dark:bg-[#2f4a26]/20"
        style={{ animationDelay: "4s" }}
      />
      <div
        className="aroma-pan absolute right-1/3 top-1/3 h-56 w-56 rounded-full bg-white/25 blur-3xl dark:bg-[#3a5a33]/15"
        style={{ animationDelay: "8s" }}
      />

      {/* floating menu figures */}
      {figures.map(({ Icon, ...figure }, index) => (
        <span
          key={index}
          className="bean-float absolute text-[#3f8a49] dark:text-[#A4D8A6]"
          style={{ top: figure.top, left: figure.left, animationDelay: figure.delay, opacity: figure.opacity }}
        >
          <Icon style={{ width: figure.size, height: figure.size }} aria-hidden />
        </span>
      ))}
    </div>
  );
}
