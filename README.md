# Splitsy

_Split the bill, keep the vibe._

A bill-splitting web app for groups of friends. Persistent groups, invite-based
bills, and **itemized, self-report splitting** — so people only pay for what they
actually had. Settle up by sharing a PromptPay number (Thai). Built as a
portfolio project: research → design → build → deploy.

## Stack

- **Monorepo:** pnpm + Turborepo
- **Web app:** Next.js 16 (App Router) + React 19 + Tailwind v4
- **Design system:** `@splitsy/design-system` (design tokens → generated CSS)
- **Backend:** Next.js Route Handlers / Server Actions (added in Week 2)
- **Database:** PostgreSQL + Prisma (added in Week 2)
- **Auth:** Clerk (Google) (added in Week 2)
- **Deploy:** Vercel (app) + Neon/Railway (database)

## Getting started

```bash
corepack enable pnpm      # once, if pnpm isn't on PATH
pnpm install
pnpm dev                  # runs the web app on http://localhost:3000
```

## Layout

```
splitsy/
├── apps/
│   └── web/                # Next.js 16 app
├── packages/
│   └── design-system/      # design tokens + shared UI (built in S3)
├── turbo.json
└── pnpm-workspace.yaml
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the week-by-week build plan.
