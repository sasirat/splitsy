# Splitsy

_Split the bill, keep the vibe._

A bill-splitting web app for groups of friends. Persistent groups, invite-based
bills, and **itemized, self-report splitting** — so people only pay for what they
actually had. Settle up by sharing a bank account or your bank app's QR, then
nudge and mark friends paid. Built as a portfolio project: research → design →
build → deploy.

**Live:** https://splitsy-pi.vercel.app (sign in with Google) — deploy notes in
[docs/DEPLOY.md](docs/DEPLOY.md).

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

`pnpm dev` uses the Neon dev database from `apps/web/.env` (copy `.env.example`).

## Running tests

Unit tests need nothing else. DB and end-to-end tests run against a **local
Postgres 17 in Docker** (`docker-compose.yml`), never Neon — they refuse to start
otherwise. Start Docker Desktop, then from `apps/web`:

```bash
pnpm test                 # unit tests (pure logic)
pnpm test:db:up           # start the test Postgres, migrate and seed it
pnpm test:db              # DB integration tests
pnpm test:e2e             # Playwright, on its own dev server (port 3100)
pnpm test:db:down         # stop the test Postgres (its data is in memory)
```

The e2e server builds into `.next-e2e`, so it runs alongside `pnpm dev`.

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
