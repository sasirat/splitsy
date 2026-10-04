"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/call-action";
import { claimPaid } from "../actions";

/** The friend's "I've paid": tells the payer, who confirms it. Can be taken
 *  back until then. Shows at once and rolls back if saving fails. */
function ClaimPaidButton({
  settlementId,
  payerName,
  claimed,
}: {
  settlementId: string;
  payerName: string;
  claimed: boolean;
}) {
  const [shownClaimed, setShownClaimed] = useOptimistic(claimed);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle() {
    setError(null);
    startTransition(async () => {
      setShownClaimed(!claimed);
      const result = await callAction(() => claimPaid({ settlementId, claimed: !claimed }));
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-divider pt-3">
      {shownClaimed ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption text-muted-foreground">
            You told {payerName} you&apos;ve paid — waiting for them to confirm.
          </p>
          <Button variant="ghost" size="sm" onClick={toggle}>
            Undo
          </Button>
        </div>
      ) : (
        <Button variant="solid" size="lg" className="w-full" onClick={toggle}>
          I&apos;ve paid
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-body text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { ClaimPaidButton };
