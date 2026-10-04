import type * as React from "react";
import { cn } from "cn";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatBaht } from "@/lib/format";

/** A "who owes you" row on the settlement screen: avatar + name + status,
 *  with the amount owed, an OWE / PAID badge, and an optional action below
 *  (the payer's "Mark paid"). */
function DebtorRow({
  name,
  initials,
  amount,
  status,
  state,
  action,
  className,
}: {
  name: string;
  initials: string;
  amount: number;
  status?: string;
  state: "owe" | "paid";
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-divider-warm p-4 last:border-b-0",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar size="lg" tone="blush">
          {initials}
        </Avatar>
        <div className="flex flex-col">
          <span className="text-body-bold wrap-anywhere text-ink">{name}</span>
          {status ? <span className="text-caption text-muted-foreground">{status}</span> : null}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amount text-sm text-primary">{formatBaht(amount)}</span>
          <Badge variant={state}>{state}</Badge>
        </div>
        {action}
      </div>
    </div>
  );
}

export { DebtorRow };
