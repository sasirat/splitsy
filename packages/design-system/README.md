# @splitsy/design-system

Splitsy's design tokens and typography presets. TypeScript is the source of truth;
run `pnpm --filter @splitsy/design-system generate` to emit the CSS.

## Structure

- `configs/` — tokens in TS: `colors.ts`, `typography.ts` (fonts, scale, presets), `scale.ts`
- `scripts/generate-theme.ts` — emits the CSS below from the configs
- `styles/theme.css` — Tailwind v4 `@theme` (colors, fonts, type scale, radii, shadows)
- `styles/typography.css` — `@utility text-*` presets

## Usage

Import both **after** Tailwind in your app's CSS entry. **Order matters:**
`typography.css` uses `@apply`, so Tailwind and `theme.css` must load first —
importing `typography.css` on its own will fail to compile.

```css
@import "tailwindcss";
@import "@splitsy/design-system/theme.css";
@import "@splitsy/design-system/typography.css";
```

## Typography presets

`text-h1`..`text-h4`, `text-body`, `text-body-bold`, `text-label`, `text-caption`,
`text-amount`, `text-wordmark`, `text-script`, `text-micro`.

- Presets compose **font + size + weight + transform only (no color)** — add the
  color at the call site: `text-label text-ink`, `text-h1 text-white`.
- Presets with a baked font-size should **not** be resized (`cn`/tailwind-merge
  can't merge a custom utility's size against `text-*`). For a variable size, use
  the size-less **`text-amount`** plus a size class, e.g. `text-amount text-5xl`.
