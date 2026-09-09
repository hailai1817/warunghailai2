import type { ColorTheme } from "./types";

function clamp(n: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Linear mix of two hex colors, t=0 -> a, t=1 -> b */
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function tint(hex: string, t: number): string {
  return mix(hex, "#ffffff", t);
}

function shade(hex: string, t: number): string {
  return mix(hex, "#000000", t);
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const BAKERY_THEME: ColorTheme = {
  id: "bakery",
  primary: "#bd6a55",
  secondary: "#d9a359",
  dark: "#56403a",
  bg: "#fbf6ef",
};

export const THEME_PRESETS: (ColorTheme & { name: string })[] = [
  { ...BAKERY_THEME, name: "Bakery" },
  {
    id: "mint",
    name: "Mint",
    primary: "#3f8f7e",
    secondary: "#8fc77a",
    dark: "#2f4a43",
    bg: "#f2faf6",
  },
  {
    id: "rose",
    name: "Rose",
    primary: "#c96a7b",
    secondary: "#e0a37c",
    dark: "#4a3540",
    bg: "#fdf4f6",
  },
  {
    id: "sky",
    name: "Sky",
    primary: "#5c8fd1",
    secondary: "#7fb3d9",
    dark: "#31425c",
    bg: "#f2f7fc",
  },
  {
    id: "mocha",
    name: "Mocha",
    primary: "#8a5a3b",
    secondary: "#b98a5a",
    dark: "#44362c",
    bg: "#f7f1e8",
  },
];

/**
 * Exact curated palette used by the default Bakery theme. Kept in sync with the
 * values in app/globals.css so the default look is pixel-identical.
 */
const BAKERY_VARS: Record<string, string> = {
  "--color-cream": "#fdf7ec",
  "--color-latte": "#f9edd9",
  "--color-crust": "#f2e1c6",
  "--color-caramel": "#d9ab6a",
  "--color-terracotta": "#bd6a55",
  "--color-choco": "#56403a",
  "--color-cocoa": "#8a6758",
  "--color-bg": "#fbf6ef",
  "--color-amber-50": "#fdf9f1",
  "--color-amber-100": "#faf0df",
  "--color-amber-200": "#f5e3c0",
  "--color-amber-300": "#efd49f",
  "--color-amber-400": "#e7bf7b",
  "--color-amber-500": "#d9a359",
  "--color-amber-600": "#b97f35",
  "--color-amber-700": "#976228",
  "--color-amber-800": "#75491f",
  "--color-amber-900": "#55331a",
  "--color-amber-950": "#3a2212",
  "--color-orange-50": "#fdf4ec",
  "--color-orange-100": "#fbe8d8",
  "--color-orange-200": "#f7d5bb",
  "--color-orange-300": "#efbf9c",
  "--color-orange-400": "#e4a37d",
  "--color-orange-500": "#d78a63",
  "--color-orange-600": "#bd6f4b",
  "--color-orange-700": "#9c5739",
  "--color-orange-800": "#7c4330",
  "--color-orange-900": "#633527",
  "--color-orange-950": "#391d16",
};

/** Separator bar between the amber-50..950 and orange-50..950 scale slots */
const SCALE_KEYS: string[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

function deriveAmberScale(secondary: string): Record<string, string> {
  return {
    "50": tint(secondary, 0.94),
    "100": tint(secondary, 0.85),
    "200": tint(secondary, 0.7),
    "300": tint(secondary, 0.52),
    "400": tint(secondary, 0.34),
    "500": secondary,
    "600": shade(secondary, 0.18),
    "700": shade(secondary, 0.33),
    "800": shade(secondary, 0.47),
    "900": shade(secondary, 0.62),
    "950": shade(secondary, 0.75),
  };
}

function deriveOrangeScale(primary: string): Record<string, string> {
  return {
    "50": tint(primary, 0.92),
    "100": tint(primary, 0.83),
    "200": tint(primary, 0.68),
    "300": tint(primary, 0.5),
    "400": tint(primary, 0.32),
    "500": primary,
    "600": shade(primary, 0.13),
    "700": shade(primary, 0.26),
    "800": shade(primary, 0.4),
    "900": shade(primary, 0.54),
    "950": shade(primary, 0.68),
  };
}

export function buildThemeVars(theme: ColorTheme): Record<string, string> {
  if (theme.id === "bakery" && theme.primary === BAKERY_THEME.primary) {
    return { ...BAKERY_VARS };
  }
  const amber = deriveAmberScale(theme.secondary);
  const orange = deriveOrangeScale(theme.primary);
  const vars: Record<string, string> = {
    "--color-cream": tint(theme.bg, 0.55),
    "--color-latte": tint(theme.bg, 0.4),
    "--color-crust": tint(theme.bg, 0.22),
    "--color-caramel": shade(theme.secondary, 0.1),
    "--color-terracotta": theme.primary,
    "--color-choco": theme.dark,
    "--color-cocoa": tint(theme.dark, 0.34),
    "--color-bg": theme.bg,
  };
  for (const k of SCALE_KEYS) {
    vars[`--color-amber-${k}`] = amber[k];
    vars[`--color-orange-${k}`] = orange[k];
  }
  return vars;
}

/** Applies a theme to the document root + ambient body background. */
export function applyThemeVars(theme: ColorTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = buildThemeVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  document.body.style.backgroundImage = `radial-gradient(1100px 700px at -5% -10%, ${hexToRgba(
    mix(theme.bg, theme.secondary, 0.5),
    0.45
  )}, transparent 60%), radial-gradient(900px 620px at 106% 4%, ${hexToRgba(
    mix(theme.bg, theme.primary, 0.4),
    0.4
  )}, transparent 55%), radial-gradient(1000px 800px at 50% 115%, ${hexToRgba(
    tint(theme.bg, 0.25),
    0.6
  )}, transparent 60%)`;
}