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
- Settlement: the payer shares a **bank account** and/or an uploaded **QR image** from their bank app
  (stored in Postgres, served by `/payment-qr/[userId]` to bill members only). We never generate QRs.
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

## Backend structure (Next.js fullstack — built in M2+)

The backend lives **inside `apps/web`** (no separate server) and mirrors the feature modules.

- `prisma/` — `schema.prisma` (User, Group, Bill, Item, ItemSplit, Settlement, InviteToken), `migrations/`, `seed.ts`.
- `src/server/` — shared, server-only infrastructure: `db.ts` (Prisma client singleton), `auth.ts` (Clerk helpers: `getCurrentUser()`, `requireUser()`).
- `src/modules/<feature>/` server files:
  - `service.ts` — **pure domain logic** (split math, debt simplification); built **test-first with Vitest**.
  - `actions.ts` — `'use server'` mutations, thin: validate (zod) → call service → Prisma.
  - `queries.ts` — server-only Prisma reads for server components.
  - `schema.ts` — zod validation.
- `src/app/api/**/route.ts` — HTTP endpoints **only where needed** (invite links, Clerk webhooks, and the future React Native app). Route handlers and server actions both wrap the **same `service.ts`**, so RN reuses the backend with no duplicated logic.

Flow: **UI → actions/queries → service → db.** Stack: Prisma + PostgreSQL (Neon/Railway), Clerk (Google) auth, zod validation.
