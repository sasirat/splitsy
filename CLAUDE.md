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

## File structure (feature modules)

Organize by **feature, not by kind**:

- `app/` — routes only; keep pages thin and compose them from modules.
- `modules/<feature>/` — self-contained feature code:
  - `components/` — feature UI (built from shared primitives)
  - `hooks/` — feature hooks
  - `actions.ts` — server actions / mutations
  - `types.ts` — feature types
  - `index.ts` — optional barrel
  - Planned modules: `bills`, `items`, `groups`, `settlement`, `auth`.
- `components/ui/` — shared, generic primitives (Button, Avatar, BottomSheet, PhoneFrame…).
- `lib/` — framework-agnostic helpers (`cn`, utils).

Rule of thumb: if it's specific to one feature it lives in that module; if it's
reused across features and carries no domain logic, it's a `components/ui` primitive.

## Backend (later phases)

Next.js Route Handlers / Server Actions + Prisma + PostgreSQL; Clerk (Google) auth.
TDD for logic (split math, debt simplification).
