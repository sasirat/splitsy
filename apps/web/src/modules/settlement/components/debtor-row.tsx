import type * as React from "react";
import { cn } from "cn";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatBaht } from "@/lib/format";

/** A "who owes you" row on the settlement screen: avatar + name + status,
 *  with the amount owed and an OWE / PAID badge. */
function DebtorRow({
  name,
  initials,
  amount,
  status,
  state,
  className,
}: {
  name: string;
  initials: string;
  amount: number;
  status?: string;
  state: "owe" | "paid";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-divider-warm p-4 last:border-b-0",
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
      <div className="flex items-center gap-2">
        <span className="text-amount text-sm text-primary">{formatBaht(amount)}</span>
        <Badge variant={state}>{state}</Badge>
      </div>
    </div>
  );
}

export { DebtorRow };
