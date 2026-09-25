/**
 * Splitsy typography tokens.
 * Judson is the app-wide font. Outfit / Cookie / IBM Plex Mono are login-only.
 * The CSS variables (--font-judson, etc.) are provided by next/font in the app.
 */
export const fonts = {
  body: "var(--font-judson), Georgia, serif", // Judson — everywhere
  display: "var(--font-outfit), system-ui, sans-serif", // Outfit — login wordmark
  script: "var(--font-cookie), cursive", // Cookie — login tagline
  mono: "var(--font-ibm-plex-mono), ui-monospace, monospace", // login microcopy
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
} as const;
