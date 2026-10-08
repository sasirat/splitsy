/**
 * Splitsy color tokens — extracted from Figma.
 * Single source of truth. After editing, run:
 *   pnpm --filter @splitsy/design-system generate
 * to regenerate styles/theme.css.
 *
 * Token names follow shadcn/ui semantics where they overlap:
 *   `muted` = a subtle surface, `muted-foreground` = secondary text.
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
  muted: "#efe9dd", // subtle surface (shadcn `bg-muted`)

  /* text */
  ink: "#1c1b18", // primary text
  "muted-foreground": "#8c8370", // secondary text (shadcn `text-muted-foreground`)
  sky: "#bae2ff", // uppercase labels on dark scenes
  lagoon: "#077cc2", // labels, links & dashed secondary buttons on light scenes
  pebble: "#909090", // quiet labels on the petal scene

  /* lines */
  border: "#cdc3ac", // input & control borders
  divider: "#fff2f3", // dividers on pink / white rows
  "divider-warm": "#e7dccb", // dividers on cream rows

  /* scene backgrounds (per-screen themes) */
  "scene-blue": "#407c9d", // login, name
  "scene-green": "#7e9352", // add-items, item-detail, summary
  "scene-sky": "#ddeefb", // new group, settlement
  "scene-petal": "#fcedf4", // group page
} as const;
