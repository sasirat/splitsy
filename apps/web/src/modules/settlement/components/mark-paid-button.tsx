"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/call-action";
import { markPaid } from "../actions";

/** The payer's "Mark paid" / "Undo" on a debtor row. */
function MarkPaidButton({
  settlementId,
  paid,
  name,
}: {
  settlementId: string;
  paid: boolean;
  /** Who this row is for, for the accessible label. */
  name: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() => markPaid({ settlementId, paid: !paid }));
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={paid ? "ghost" : "solid"}
        size="sm"
        onClick={toggle}
        disabled={pending}
        aria-label={paid ? `Undo ${name} paid` : `Mark ${name} paid`}
      >
        {pending ? "Saving…" : paid ? "Undo" : "Mark paid"}
      </Button>
      {error ? (
        <p role="alert" className="text-caption text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { MarkPaidButton };
