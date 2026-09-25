/** Corner radii (px), from the Figma frames. */
export const radius = {
  xs: "5px", // checkbox
  sm: "6px", // badges (OWE / PAID)
  md: "10px", // chips
  lg: "12px", // inputs
  xl: "16px", // avatars, cards
  "2xl": "24px", // bottom sheet
  full: "999px", // pills / buttons
} as const;

/** Elevation. */
export const shadow = {
  card: "0px 8px 20px -2px rgba(0, 0, 0, 0.04), 0px 2px 8px 0px rgba(0, 0, 0, 0.08)",
  button: "0px 4px 6px rgba(0, 0, 0, 0.13)",
} as const;
