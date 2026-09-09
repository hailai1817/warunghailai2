"use client";

interface BrandLogoProps {
  className?: string;
}

const CREAM = "#fdf7ec";
const BUTTER = "#d9a359";
const BUTTER_DARK = "#a56f3a";
const TERRACOTTA = "#bd6a55";
const CHOCO = "#56403a";

export default function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Logo HaiLai's Bakery and Cafe"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="23" fill={CREAM} />
      <circle
        cx="24"
        cy="24"
        r="23"
        fill="none"
        stroke={BUTTER_DARK}
        strokeOpacity="0.25"
        strokeWidth="1.6"
      />
      <circle
        cx="24"
        cy="24"
        r="20.2"
        fill="none"
        stroke={BUTTER}
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="1.5 3.5"
      />
      <ellipse cx="24" cy="33.4" rx="12.4" ry="1.8" fill={TERRACOTTA} />
      <path
        d="M14.4 25.6 17.2 32Q17.6 33 18.8 33H29.2Q30.4 33 30.8 32L33.6 25.6Z"
        fill={CHOCO}
      />
      <ellipse cx="24" cy="25.6" rx="8.6" ry="1.7" fill={CREAM} />
      <path
        d="M34 27.6C37.6 27.4 37.8 31.2 34 31.4"
        fill="none"
        stroke={TERRACOTTA}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M24.5 23.6C22.8 21.8 26.6 20.8 24.8 19.2"
        fill="none"
        stroke={TERRACOTTA}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M29.6 23.2C28 21.6 31.4 20.8 29.6 19.4"
        fill="none"
        stroke={TERRACOTTA}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M10 17.6C12 9 36.5 8.8 38.6 17.6C33.4 22 14.8 21.8 10 17.6Z" fill={BUTTER} />
      <path
        d="M15.2 19.6C15.8 15.8 18.4 12.8 22.4 11.2"
        fill="none"
        stroke={CREAM}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M20.8 20.9C21.4 17 24 14 28 12.6"
        fill="none"
        stroke={CREAM}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M26.6 20.4C27.4 17.2 30 15 33.6 14.6"
        fill="none"
        stroke={CREAM}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9.4 18.4C10.6 19.6 12.6 19.9 14.4 19.2"
        fill="none"
        stroke={BUTTER_DARK}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M36.9 19C35.8 20.2 33.9 20.3 32.1 19.2"
        fill="none"
        stroke={BUTTER_DARK}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}