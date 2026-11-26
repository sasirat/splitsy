"use client";

import { cn } from "cn";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/call-action";
import { deleteBill } from "../actions";

/** "Delete bill" link + a confirm sheet saying what goes with it. Only render
 *  it while the bill can be deleted (nobody has paid yet); the server checks
 *  again, so a payment landing meanwhile is refused with a message. */
function DeleteBillButton({
  billId,
  title,
  itemCount,
  settling = false,
  className,
}: {
  billId: string;
  title: string;
  /** For the confirm text; omit when the page doesn't know it. */
  itemCount?: number;
  /** Settling has started, so the settle-up is deleted too. */
  settling?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() => deleteBill({ billId }));
      if (!result.ok) return setError(result.error);
      router.push(result.redirectTo);
    });
  }

  const parts = [
    itemCount === undefined
      ? "its items"
      : itemCount > 0
        ? `its ${itemCount} item${itemCount === 1 ? "" : "s"}`
        : null,
    itemCount !== 0 ? "everyone's claims" : null,
    settling ? "the settle-up" : null,
  ].filter((part): part is string => part !== null);
  // "Its 3 items, everyone's claims and the settle-up go too."
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
  const goes = list
    ? `${list[0]?.toUpperCase()}${list.slice(1)} ${parts.length > 1 ? "go" : "goes"} too. `
    : "";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={cn("text-caption underline underline-offset-4 tap-target", className)}
      >
        Delete bill
      </button>

      <BottomSheet
        open={open}
        onOpenChange={(next) => !pending && setOpen(next)}
        title={`Delete ${title}?`}
      >
        <div className="flex flex-col gap-4 pb-6">
          <p className="text-body text-muted-foreground">{goes}This can&apos;t be undone.</p>
          {error ? (
            <p role="alert" className="text-body text-primary">
              {error}
            </p>
          ) : null}
          <Button variant="solid" size="lg" className="w-full" disabled={pending} onClick={remove}>
            {pending ? "Deleting…" : "Delete bill"}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}

export { DeleteBillButton };
