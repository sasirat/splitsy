# Deploying Splitsy (Vercel + Neon + Clerk)

Production runs on **Vercel** (functions in Singapore, `sin1`) against a
**Neon** database in Singapore (`ap-southeast-1`), with **Clerk** for Google
sign-in. Config lives in `apps/web/vercel.json`; every deploy runs
`prisma migrate deploy` before `next build`, so the database schema always
matches the code.

Dev sign-in ("Continue as Mint") is off in production — only Google works.

## 1. Neon: a production database in Singapore

1. Neon console → **New project** → region **AWS Asia Pacific (Singapore)**,
   Postgres 17. (Your dev database stays in its own project.)
2. **Connect** → copy both connection strings:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **Direct** (no `-pooler`) → `DIRECT_URL`

Don't run the seed against production — it's for local/dev data.

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
   | `DATABASE_URL`                      | Neon pooled URL (step 1)                 |
   | `DIRECT_URL`                        | Neon direct URL (step 1)                 |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` from your Clerk dev instance |
   | `CLERK_SECRET_KEY`                  | `sk_test_…` from your Clerk dev instance |

   **Preview** environment: the same two Clerk keys, plus `DATABASE_URL` and
   `DIRECT_URL` from a separate Neon branch — in the production project,
   **Branches → New branch** named `preview`, then copy its pooled and
   direct URLs. Previews can migrate that branch freely; reset it from
   `main` in the Neon console whenever you like.

4. **Deploy.** The build log should show "All migrations have been
   successfully applied" before Next builds.

## 3. Clerk (development instance, for now)

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
