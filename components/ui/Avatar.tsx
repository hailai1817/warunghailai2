"use client";

import { useState } from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  bordered?: boolean;
}

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-24 w-24 text-3xl",
};

export default function Avatar({
  src,
  name,
  size = "md",
  className = "",
  bordered = false,
}: AvatarProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [imgFailed, setImgFailed] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgFailed(false);
  }

  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const borderClass = bordered ? "border-2 border-white shadow-sm ring-2 ring-stone-200/70" : "";

  if (src && !imgFailed) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-stone-100 ${sizeClass} ${borderClass} ${className}`}
      >
        <Image
          src={src}
          alt={name}
          fill
          unoptimized
          sizes="128px"
          className="object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-[var(--color-terracotta)] to-amber-700 font-extrabold text-white shadow-sm ${sizeClass} ${borderClass} ${className}`}
      title={name}
    >
      <span>{initial}</span>
    </div>
  );
}
