# Deploying Splitsy (Vercel + Neon + Clerk)

Production runs on **Vercel** with functions in **Cleveland (`cle1`)**, right
next to the **Neon** project's region (AWS `us-east-2`, Ohio), with **Clerk**
for Google sign-in. Each page makes several database calls in a row, so the
server sits beside the database: users in Thailand pay one ~250 ms trip to the
US per request, not one per query. Config lives in `apps/web/vercel.json`;
every deploy runs `prisma migrate deploy` before `next build`, so the database
schema always matches the code.

Dev sign-in ("Continue as Mint") is off in production — only Google works.

## 1. Neon: two branches in the existing project

Production uses the same Neon project as development, on its own branches.
A new branch starts as a **copy of its parent's data**, so production gets
emptied once and its first deploy builds every table from the migrations.

1. Neon console → your Splitsy project → **Branches**. Note which branch your
   `apps/web/.env` uses (its endpoint id is in the URL host, `ep-…`) — that's
   your **dev** branch. Leave it alone.
2. **New branch** `live` (production), parent = your dev branch.
3. **SQL Editor** → in the branch dropdown pick **`live`** — double-check it
   says `live` — and run:

   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

   This empties only the new `live` copy. The first deploy recreates the
   tables with no seed users or test bills.

4. **New branch** `preview`, parent = your dev branch. Keep its data: preview
   deployments can migrate and play with it freely, and you can reset it from
   its parent whenever you like.
5. For both `live` and `preview`: **Connect** → copy the **pooled** URL (host
   contains `-pooler`) and the **direct** URL (no `-pooler`).

Don't run the seed against `live`.

## 2. Vercel: import the repo

1. vercel.com → **Add New… → Project** → import the GitHub repo.
2. **Root Directory**: `apps/web` (Vercel detects the pnpm workspace and
   installs from the repo root). Framework: Next.js. Leave build/install
   commands empty — `vercel.json` sets them.
3. **Environment Variables.** Every build runs `prisma migrate deploy`, so
   **Preview builds must never point at the production database** — a
   preview of an unmerged branch would migrate production ahead of its code.

   **Production** environment only:

   | Name                                | Value                                    |
   | ----------------------------------- | ---------------------------------------- |
   | `DATABASE_URL`                      | `live` branch pooled URL                 |
   | `DIRECT_URL`                        | `live` branch direct URL                 |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` from your Clerk dev instance |
   | `CLERK_SECRET_KEY`                  | `sk_test_…` from your Clerk dev instance |

   **Preview** environment: the same two Clerk keys, plus `DATABASE_URL` and
   `DIRECT_URL` from the **`preview`** branch.

4. **Deploy.** The build log should show "All migrations have been
   successfully applied" before Next builds.
5. **Settings → Domains → Add Domain** → a `*.vercel.app` name for
   **Production** (ours: `splitsy-pi.vercel.app`). The automatic
   per-deployment and branch URLs stay behind Vercel login (Deployment
   Protection) — good for previews, but friends need the production domain.

## 3. Clerk (development instance, for now)

Paste the Clerk keys **exactly** — no quotes, no spaces (copy them with the
copy buttons at dashboard.clerk.com → Configure → API keys). Keep
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as a **Config** variable: Vercel warns
about its public prefix, but publishable keys are meant to be public and
Clerk's sign-in needs it in the browser. A bad value shows up as a 500 on
every page ("Publishable key not valid"); after fixing it, redeploy without
the build cache, since the key is baked in at build time.

The dev instance works on the `*.vercel.app` URL, with a small "development
mode" badge and dev-instance usage limits — fine for testing with friends.
A **production** instance needs a domain you own (DNS records), so it waits
for a custom domain (S24). When you switch, only the two Clerk keys change.

## 4. Smoke test (on a phone)

1. Sign in with Google → onboarding asks for your name.
2. New bill → add 2–3 items → Invite friends → copy the link.
3. Second Google account (another browser/phone) opens the link → joins →
   claims an item.
4. Payer: every item claimed → **Settle up** → add a bank account / QR.
5. Friend: sees "Pay …", copies the account number → **I've paid**.
6. Payer: **Nudge** shares a reminder; **Confirm paid** → "all settled";
   home shows the bill as **Settled**.

## Updating

Push to `main` → Vercel redeploys and migrates. New migrations must be safe
to run on live data (add columns as optional, backfill, then tighten).
