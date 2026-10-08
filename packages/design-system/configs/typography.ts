/**
 * Splitsy typography tokens + presets.
 * Judson is the app-wide font. Outfit / Cookie / IBM Plex Mono are login-only;
 * Kapakana and Bonheur Royale are one-off script titles (new group, invite).
 * The CSS variables (--font-judson, etc.) are provided by next/font in the app.
 */
export const fonts = {
  body: "var(--font-judson), Georgia, serif", // Judson — everywhere
  display: "var(--font-outfit), system-ui, sans-serif", // Outfit — login wordmark
  script: "var(--font-cookie), cursive", // Cookie — login tagline
  mono: "var(--font-ibm-plex-mono), ui-monospace, monospace", // login microcopy
  flourish: "var(--font-kapakana), cursive", // Kapakana — "New Group" title
  royale: "var(--font-bonheur-royale), cursive", // Bonheur Royale — "You're invited"
} as const;

/** Type scale (px), taken from the Figma frames. */
export const fontSize = {
  "2xs": "10px",
  xs: "11px",
  sm: "13px",
  base: "15px",
  md: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "22px",
  "3xl": "28px",
  "4xl": "32px",
  "5xl": "36px",
  "6xl": "48px",
  "7xl": "96px",
} as const;

/**
 * Semantic typography presets — generated to Tailwind v4 `@utility text-<name>`.
 * Compose font + size + weight + transform only (NO color), so callers add the
 * color for the scene, e.g. `text-label text-ink` or `text-h1 text-white`.
 * Presets whose size varies (amount) omit the size, so a size class can be added.
 */
export const typePresets = {
  h1: "font-body text-4xl font-bold", // 32 — big screen titles
  h2: "font-body text-3xl font-bold", // 28 — "Add item"
  h3: "font-body text-2xl font-bold", // 22 — card titles
  h4: "font-body text-xl font-bold", // 20 — small titles
  body: "font-body text-base", // 15 — default text
  "body-bold": "font-body text-base font-bold",
  label: "font-body text-sm font-bold uppercase", // 13 — section labels
  caption: "font-body text-2xs", // 10 — dates, statuses
  amount: "font-body font-bold tabular-nums", // ฿ figures — add a size
  wordmark: "font-display text-6xl font-black", // "Splitsy"
  script: "font-script text-2xl", // tagline
  micro: "font-mono text-2xs font-bold uppercase tracking-wide", // "terms, privacy"
  flourish: "font-flourish text-7xl leading-none", // "New Group"
  royale: "font-royale text-6xl tracking-wide", // "You're invited"
} as const;
