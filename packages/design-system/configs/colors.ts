/**
 * Splitsy color tokens — extracted from Figma.
 * Single source of truth. After editing, run:
 *   pnpm --filter @splitsy/design-system generate
 * to regenerate styles/theme.css.
 */
export const colors = {
  /** berry red — primary buttons, key text, borders, wordmark, checkbox fill */
  primary: "#801115",

  /* pinks */
  blush: "#f8c9de", // primary buttons on light scenes, badges, chips
  pink: "#f4b4c5", // receipt avatar fills

  /* surfaces */
  paper: "#faf9f0", // cards, sheets
  cream: "#fdfbf2", // lighter off-white / page base
  white: "#ffffff",

  /* text */
  ink: "#1c1b18", // primary text
  muted: "#8c8370", // secondary text
  sky: "#bae2ff", // uppercase labels on dark scenes

  /* lines */
  border: "#cdc3ac", // input & control borders
  divider: "#fff2f3", // dividers on pink / white rows
  "divider-warm": "#e7dccb", // dividers on cream rows

  /* scene backgrounds (per-screen themes) */
  "scene-blue": "#407c9d", // login, name
  "scene-green": "#7e9352", // add-items, item-detail, summary
  "scene-berry": "#621e20", // settlement
} as const;
