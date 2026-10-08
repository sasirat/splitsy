"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/call-action";
import { startSettling } from "../actions";

/** The payer's "Settle up" on the summary: after a confirm (it can't be
 *  undone — items lock), locks the bill and opens the settle screen. Disabled
 *  (with the reason) while items are unclaimed. */
function SettleUpButton({ billId, blockedReason }: { billId: string; blockedReason?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function settle() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() => startSettling({ billId }));
      if (result.ok) router.push(`/bills/${billId}/settle`);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="w-full"
        disabled={!!blockedReason}
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        Settle up
      </Button>
      {blockedReason ? (
        <p className="text-center text-caption text-cream/90">{blockedReason}</p>
      ) : null}

      <BottomSheet
        open={confirming}
        onOpenChange={(open) => !pending && setConfirming(open)}
        title="Lock the bill and settle up?"
      >
        <div className="flex flex-col gap-4 pb-6">
          <p className="text-body text-muted-foreground">
            Nobody can add items or change who had what after this, so check everyone has claimed
            what they had.
          </p>
          {error ? (
            <p role="alert" className="text-body text-primary">
              {error}
            </p>
          ) : null}
          <Button variant="solid" size="lg" className="w-full" disabled={pending} onClick={settle}>
            {pending ? "Settling up…" : "Lock and settle up"}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

export { SettleUpButton };
