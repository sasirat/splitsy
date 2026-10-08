/**
 * Splitsy typography tokens + presets.
 * Judson is the app-wide font. Outfit / Cookie are login-only; IBM Plex Mono is
 * login microcopy + the group-name input;
 * Kapakana and Bonheur Royale are one-off script titles (new group, invite).
 * The CSS variables (--font-judson, etc.) are provided by next/font in the app.
 */
export const fonts = {
  body: "var(--font-judson), Georgia, serif", // Judson — everywhere
  display: "var(--font-outfit), system-ui, sans-serif", // Outfit — login wordmark
  script: "var(--font-cookie), cursive", // Cookie — login tagline
  mono: "var(--font-ibm-plex-mono), ui-monospace, monospace", // login microcopy, group-name input
  flourish: "var(--font-kapakana), cursive", // Kapakana — "New Group" title
  royale: "var(--font-bonheur-royale), cursive", // Bonheur Royale — "You're invited"
} as const;

/** Type scale (px), from the Figma frames — except 2xs–lg, raised in S21
 *  because text was too small on phones (Figma: 2xs 10, xs 11, sm 13,
 *  base 15, md 16, lg 18). Headings (xl and up) keep Figma's sizes; a bump
 *  to 22/24/30/34 read too big. Figma's text styles weren't updated. */
export const fontSize = {
  "2xs": "14px",
  xs: "14px",
  sm: "16px",
  base: "18px",
  md: "18px",
  lg: "20px",
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
  body: "font-body text-base", // 18 — default text
  "body-bold": "font-body text-base font-bold",
  label: "font-body text-sm font-bold uppercase", // 16 — section labels
  caption: "font-body text-2xs", // 14 — dates, statuses
  amount: "font-body font-bold tabular-nums", // ฿ figures — add a size
  wordmark: "font-display text-6xl font-black", // "Splitsy"
  script: "font-script text-2xl", // tagline
  micro: "font-mono text-2xs font-bold uppercase tracking-wide", // "terms, privacy"
  flourish: "font-flourish text-[length:min(var(--text-7xl),24vw)] leading-none", // "New Group", shrinks on narrow phones
  royale: "font-royale text-6xl tracking-wide", // "You're invited"
} as const;
