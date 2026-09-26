# Feature modules

Feature-first organization. Each module is self-contained; import shared
primitives from `@/components/ui` and helpers from `@/lib`.

```
modules/<feature>/
├─ components/   # feature UI (composed from shared primitives)
├─ hooks/        # feature hooks
├─ actions.ts    # server actions / mutations
├─ types.ts      # feature types
└─ index.ts      # optional barrel
```

Planned modules:

- **bills** — create/fetch a bill, the receipt view (ReceiptCard, ItemRow, TotalDisplay)
- **items** — add/edit an item and its splits (item detail, self-report)
- **groups** — persistent groups + membership, invite/join
- **settlement** — "who owes whom", PromptPay number, mark-as-paid (DebtorRow)
- **auth** — Google sign-in + onboarding (display name)

Folders are created as each feature is built (see ROADMAP.md).
