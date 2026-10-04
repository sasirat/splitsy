"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/call-action";
import { recordNudge } from "../actions";
import { nudgeMessage } from "../service";

/** The payer's "Nudge": a friendly reminder through the phone's share sheet
 *  (LINE, Messenger…), or copied where sharing isn't available. Only a
 *  reminder that actually went out is recorded. */
function NudgeButton({
  settlementId,
  billId,
  billTitle,
  name,
  amountSatang,
}: {
  settlementId: string;
  billId: string;
  billTitle: string;
  name: string;
  amountSatang: number;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function nudge() {
    setNote(null);
    const url = `${window.location.origin}/bills/${billId}/settle`;
    const text = nudgeMessage({ name, billTitle, amountSatang, url });
    startTransition(async () => {
      try {
        if (navigator.share) {
          await navigator.share({ text });
        } else {
          await navigator.clipboard.writeText(text);
          setNote("Reminder copied — paste it in your chat");
        }
      } catch (error) {
        // Closing the share sheet isn't a nudge; a blocked clipboard is worth saying.
        if (error instanceof DOMException && error.name === "AbortError") return;
        setNote("Couldn't share or copy the reminder");
        return;
      }
      const result = await callAction(() => recordNudge({ settlementId }));
      if (!result.ok) setNote(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={nudge}
        disabled={pending}
        aria-label={`Nudge ${name}`}
      >
        Nudge
      </Button>
      {note ? (
        <p role="status" className="text-right text-caption text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export { NudgeButton };
