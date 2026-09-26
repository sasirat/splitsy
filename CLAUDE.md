# Splitsy — working agreement & project notes

## Our workflow (follow every step)

1. **Plan first.** Before writing code for a step, write a short plan and get approval.
2. **Code.** Implement the approved plan.
3. **Commit & push.** Commit and push to GitHub.
4. **Code review.** Review the pushed changes (`/code-review`) and surface findings.
5. **Fix / refactor.** Apply the review fixes or refactors as a follow-up.
6. **Next step.** Only then move to the next roadmap item.

## Project

Splitsy — a bill-splitting web app (portfolio). _"Split the bill, keep the vibe."_
See [ROADMAP.md](./ROADMAP.md) for the build plan (currently in **S4**).

## Stack & conventions

- Monorepo: **pnpm + Turborepo** (`apps/web`, `packages/design-system`).
- Web: **Next.js 16** (App Router) + **React 19**.
- **Styling: Tailwind v4 only.** No other CSS framework.
- Design tokens: `packages/design-system` — TS configs → generated `@theme.css`
  (`pnpm --filter @splitsy/design-system generate`). Single source of truth.
- Components: **shadcn/ui**, restyled to Splitsy tokens.
- Fonts: **Judson** app-wide; **Outfit / Cookie / IBM Plex Mono** login-only.
- Settlement: display a **PromptPay** bank/mobile number (no QR).
- Do **not** modify or copy from `~/source/larngear/cu-cpmo` (former employer's code — reference only).

## Backend (later phases)

Next.js Route Handlers / Server Actions + Prisma + PostgreSQL; Clerk (Google) auth.
TDD for logic (split math, debt simplification).
