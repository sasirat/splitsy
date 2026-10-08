"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/call-action";
import { formatBaht } from "@/lib/format";
import { TotalDisplay } from "@/modules/bills/components/total-display";
import { markPaid } from "../actions";
import { DebtorRow } from "./debtor-row";
import { NudgeButton } from "./nudge-button";

export type PayerRow = {
  id: string;
  name: string;
  initials: string;
  amountSatang: number;
  paid: boolean;
  /** Labels worked out on the server, so they match what it rendered. */
  paidLabel: string | null;
  nudgedLabel: string | null;
  claimedLabel: string | null;
};

function statusOf(row: PayerRow): string {
  if (row.paid) return row.paidLabel ?? "Paid just now";
  return row.claimedLabel ?? row.nudgedLabel ?? "Waiting to pay";
}

/** The payer's side of settle-up: what's still owed, then each friend with
 *  Nudge and Mark paid. Marking paid (or undoing it) shows at once and rolls
 *  back with a message if it fails. */
function PayerDebtorList({
  billId,
  billTitle,
  rows,
  paymentDetails,
}: {
  billId: string;
  billTitle: string;
  rows: PayerRow[];
  /** The "Friends pay you by" card, shown under the total. */
  paymentDetails: ReactNode;
}) {
  const [shown, setPaid] = useOptimistic(rows, (current, change: { id: string; paid: boolean }) =>
    current.map((row) =>
      row.id === change.id
        ? { ...row, paid: change.paid, paidLabel: null, claimedLabel: null }
        : row,
    ),
  );
  const [error, setError] = useState<string | null>(null);
  // Rows with a save in flight. Their button is disabled: it flips to "Undo"
  // at once, so a double tap would otherwise mark paid and straight back.
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set());
  const [, startTransition] = useTransition();

  function toggle(row: PayerRow) {
    if (saving.has(row.id)) return;
    setError(null);
    setSaving((ids) => new Set(ids).add(row.id));
    startTransition(async () => {
      setPaid({ id: row.id, paid: !row.paid });
      const result = await callAction(() => markPaid({ settlementId: row.id, paid: !row.paid }));
      if (!result.ok) setError(`Couldn't update ${row.name}: ${result.error}`);
      setSaving((ids) => {
        const rest = new Set(ids);
        rest.delete(row.id);
        return rest;
      });
    });
  }

  const total = shown.reduce((sum, row) => sum + row.amountSatang, 0);
  const paidBack = shown.reduce((sum, row) => sum + (row.paid ? row.amountSatang : 0), 0);

  return (
    <>
      {paidBack === total ? (
        // Nothing left to chase: say so instead of a big "฿0".
        <div className="flex flex-col gap-1 text-primary">
          <p className="text-h3">All settled</p>
          <p className="text-caption text-primary/80">Everyone has paid you back — all settled.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <TotalDisplay
            label="Owed to you"
            amount={total - paidBack}
            className="px-0 text-primary"
          />
          <p className="text-caption text-primary/80">
            {formatBaht(paidBack)} of {formatBaht(total)} paid back
          </p>
        </div>
      )}
      {paymentDetails}

      <section className="flex flex-col gap-2">
        <h2 className="text-label text-lagoon">Who owes you</h2>
        {error ? (
          <p role="alert" className="rounded-lg bg-paper px-4 py-3 text-body text-primary">
            {error}
          </p>
        ) : null}
        <div className="overflow-hidden rounded-lg bg-paper">
          {shown.map((row) => (
            <DebtorRow
              key={row.id}
              name={row.name}
              initials={row.initials}
              amount={row.amountSatang}
              status={statusOf(row)}
              state={row.paid ? "paid" : "owe"}
              action={
                <div className="flex items-start gap-1">
                  {/* No nudging someone who's paid or says they have. */}
                  {row.paid || row.claimedLabel ? null : (
                    <NudgeButton
                      settlementId={row.id}
                      billId={billId}
                      billTitle={billTitle}
                      name={row.name}
                      amountSatang={row.amountSatang}
                    />
                  )}
                  <Button
                    variant={row.paid ? "ghost" : "solid"}
                    size="sm"
                    onClick={() => toggle(row)}
                    disabled={saving.has(row.id)}
                    aria-label={row.paid ? `Undo ${row.name} paid` : `Mark ${row.name} paid`}
                  >
                    {row.paid ? "Undo" : row.claimedLabel ? "Confirm paid" : "Mark paid"}
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      </section>
    </>
  );
}

export { PayerDebtorList };
