"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/call-action";
import { startSettling } from "../actions";

/** The payer's "Settle up" on the summary: locks the bill and opens the
 *  settle screen. Disabled (with the reason) while items are unclaimed. */
function SettleUpButton({ billId, blockedReason }: { billId: string; blockedReason?: string }) {
  const router = useRouter();
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
      <Button size="lg" className="w-full" disabled={pending || !!blockedReason} onClick={settle}>
        {pending ? "Settling up…" : "Settle up"}
      </Button>
      {blockedReason ? (
        <p className="text-center text-caption text-cream/90">{blockedReason}</p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-paper px-4 py-3 text-body text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { SettleUpButton };
