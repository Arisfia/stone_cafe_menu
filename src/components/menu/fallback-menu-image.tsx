"use client";

import { useState } from "react";

const defaultMenuImage = "/default-menu-item.svg";

export function FallbackMenuImage({ src, alt }: { src?: string; alt: string }) {
  const [imageSrc, setImageSrc] = useState(src || defaultMenuImage);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => setImageSrc(defaultMenuImage)}
    />
  );
}
