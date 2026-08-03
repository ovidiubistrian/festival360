"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "onError"> & {
  fallbackLabel?: string;
};

/**
 * next/image wrapper with an elegant branded fallback when the remote image
 * fails to load — no broken image icons in the demo.
 */
export function ImageWithFallback({
  fallbackLabel,
  className,
  alt,
  ...props
}: Props) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[color:var(--cream)] to-[color:var(--cream-200)] text-[color:var(--prispa-green)]",
          className
        )}
        role="img"
        aria-label={typeof alt === "string" ? alt : fallbackLabel}
      >
        <ImageOff className="h-6 w-6 opacity-40" />
        {fallbackLabel ? (
          <span className="px-4 text-center text-xs font-medium opacity-70">
            {fallbackLabel}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
