# Splitsy — Build Roadmap

Pace: **~4–5 h/day**, ~5 days/week → roughly a **5-week** plan (compresses to
~3.5–4 weeks at 6–7 days/week). Core app done by Week 4; Week 5 is polish +
real-world testing + buffer.

Principle: **build one full vertical slice first** (login → create bill → add
one item → see summary) before polishing any single screen.

---

## Milestones

- **M0** Foundations, deployed empty — _~1–1.5 days_
- **M1** Design system + component library — _~2–3 days_
- **M2** Data model + backend foundation — _~1.5–2 days_
- **M3** Vertical slice, end-to-end — _~3–4 days_
- **M4** Groups, invite/join, settlement — _~3–4 days_
- **M5** Polish, real test, ship — _~2–3 days_

Core total: ~13–18 focused dev-days.

---

## Week 1 — Foundations + Design System (M0 + M1)

- [x] **S1** Monorepo (pnpm + Turbo) + Next.js 16 + Tailwind v4 + lint/format; Git + GitHub
- [ ] **S2** Deploy empty app → Vercel + create Postgres (Neon) + env wiring _(skipped for now — deploy later)_
- [x] **S3** `design-system` package: Figma tokens (colors, fonts, radii) + `/playground` _(image assets deferred to S4–S5)_
- [x] **S4** Components pt.1 on shadcn/ui: Button, Avatar/AvatarStack, Pill, Badge, Input, Checkbox + MemberRow → `/playground/components`
- [x] **S5** Components pt.2: ReceiptCard (torn edge), ItemRow, TotalDisplay, BottomSheet, DebtorRow, PhoneFrame
- **Done when:** every component themed and visible at `/playground`; app deploys.

## Week 2 — Data model + backend + start slice (M2 → M3)

- [x] **S6** Prisma schema (User, Group, GroupMember, Bill, Item, ItemSplit, Settlement, InviteToken) + migration + seed
- [x] **S7** Dev sign-in (tap a seeded user, dev-only) + protected routes; login screen from Figma _(Clerk moved to S14b)_
- [ ] **S8** Server Actions: create bill, fetch bill, add item
- [ ] **S9** Onboarding "name" + minimal create-bill wired to DB
- [ ] **S10** Add-items screen wired (list + add, persisted)
- **Done when:** log in → create a bill → add items, all persisted.

## Week 3 — Vertical slice complete (finish M3 → start M4)

- [ ] **S11** Item-detail split (self-report checkboxes) → persist ItemSplit, live per-head amounts
- [ ] **S12** Bill summary (itemized, "shared by", subtotal/total) from DB
- [ ] **S13** End-to-end pass of the slice; fix breakage; loading/error/empty states
- [ ] **S14** Persistent groups + membership; attach bills to a group
- [ ] **S14b** Clerk Google auth replaces dev sign-in (invitees need real accounts); swap only `src/server/auth.ts` + login footer
- [ ] **S15** Invite via share link (token) + join flow
- **Done when:** full core loop works for a real multi-person bill.

## Week 4 — Settlement + debt simplification (finish M4)

- [ ] **S16** Debt-simplification logic ("who owes whom") + Vitest tests
- [ ] **S17** "You fronted it" settlement screen: who owes you, amounts, pending/paid
- [ ] **S18** PromptPay: store number/bank, display + copy, mark-as-paid
- [ ] **S19** Polish settlement + nudge; remaining states
- [ ] **S20** Buffer / catch-up
- **Done when:** settle-up works; core feature-complete.

## Week 5 — Polish, real test, ship (M5 + buffer)

- [ ] **S21** Full self-walkthrough; rough edges; mobile responsiveness
- [ ] **S22** 2–3 friends on a real bill; collect feedback
- [ ] **S23** Fix breakage; empty/error states; a11y pass
- [ ] **S24** Final deploy; README + short case-study writeup
- [ ] **S25** Buffer / first stretch goal (receipt photo or QR)
- **Done when:** shipped, tested, documented.

---

## Stretch goals (after core is solid)

- [ ] Receipt photo attachment on items
- [ ] Receipt scanning via OCR (manual entry always works as fallback)
- [ ] PromptPay QR generation
- [ ] Recurring bills (rent, subscriptions)
- [ ] Spending insights (per-group, per-month)
