"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}

export default function StarRating({
  value,
  onChange,
  size = 16,
  className = "",
}: StarRatingProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        const star = (
          <Star
            style={{ width: size, height: size }}
            className={`${filled ? "text-amber-400" : "text-stone-300"}`}
            fill={filled ? "currentColor" : "none"}
          />
        );
        if (!onChange) {
          return (
            <span key={i} aria-hidden>
              {star}
            </span>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-label={`${i} dari 5 bintang`}
            className="rounded p-0.5 transition hover:scale-110"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
