"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

const defaultMenuImage = "/stone-cafe-logo.jpg";

export function FallbackMenuImage({ src, alt }: { src?: string; alt: string }) {
  const [imageSrc, setImageSrc] = useState(src || defaultMenuImage);
  const isDefaultImage = imageSrc === defaultMenuImage;

  useEffect(() => {
    setImageSrc(src || defaultMenuImage);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      className={cn(
        "h-full w-full transition-transform duration-500 group-hover:scale-105",
        isDefaultImage ? "object-contain p-8 sm:p-10" : "object-cover"
      )}
      onError={() => setImageSrc(defaultMenuImage)}
    />
  );
}
