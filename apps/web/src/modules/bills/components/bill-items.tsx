"use client";

import { cn } from "cn";
import Link from "next/link";
import type { ReactNode } from "react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { callAction } from "@/lib/call-action";
import { formatBaht } from "@/lib/format";
import { setMyClaim } from "@/modules/items/actions";
import { AddItemSheet, type NewItem } from "@/modules/items/components/add-item-sheet";
import { ItemSplitSheet, type SplitMember } from "@/modules/items/components/item-split-sheet";
import type { Sharer } from "../split-hint";
import { ItemRow } from "./item-row";
import { ReceiptCard } from "./receipt-card";
import { TotalDisplay } from "./total-display";

export type ReceiptItem = {
  id: string;
  name: string;
  priceSatang: number;
  sharers: (Sharer & { userId: string; shares: number })[];
  /** Added on this screen, not yet confirmed by the server. */
  pending?: boolean;
};

type OptimisticChange =
  | { type: "add"; item: ReceiptItem }
  | { type: "claim"; itemId: string; claimed: boolean; me: SplitMember };

function applyChange(items: ReceiptItem[], change: OptimisticChange): ReceiptItem[] {
  if (change.type === "add") return [...items, change.item];
  const { itemId, claimed, me } = change;
  return items.map((item) => {
    if (item.id !== itemId) return item;
    const others = item.sharers.filter((sharer) => sharer.userId !== me.id);
    const sharers = claimed
      ? [...others, { userId: me.id, initials: me.initials, shares: 1 }]
      : others;
    return { ...item, sharers };
  });
}

const sum = (items: ReceiptItem[]) => items.reduce((total, item) => total + item.priceSatang, 0);

/** The bill's receipt with rapid add-item entry and a pinned running total.
 *  New items show instantly (faded) and settle once the server confirms.
 *  Tap an item to claim your share; claims also update instantly. */
function BillItems({
  billId,
  title,
  meta,
  items,
  payerName,
  canEdit,
  settled = false,
  members,
  currentUserId,
  invite,
}: {
  billId: string;
  title: string;
  meta: string;
  items: ReceiptItem[];
  payerName: string;
  /** False once the bill is settling: no new items, no claim changes. */
  canEdit: boolean;
  /** Everyone has paid the payer back. */
  settled?: boolean;
  members: SplitMember[];
  currentUserId: string;
  /** Rendered under the add-item button, e.g. the invite button. */
  invite?: ReactNode;
}) {
  const [shownItems, applyOptimistic] = useOptimistic(items, applyChange);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splitItemId, setSplitItemId] = useState<string | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const nextPendingId = useRef(0);

  const me = members.find((member) => member.id === currentUserId);
  const splitTarget = shownItems.find((item) => item.id === splitItemId);

  function onOptimisticAdd(item: NewItem) {
    applyOptimistic({
      type: "add",
      item: { ...item, id: `pending-${nextPendingId.current++}`, sharers: [], pending: true },
    });
  }

  function openSplit(itemId: string) {
    setSplitItemId(itemId);
    setSplitError(null);
    setSplitOpen(true);
  }

  function onClaimChange(claimed: boolean) {
    if (!splitTarget || !me) return;
    const { id: itemId, name } = splitTarget;
    setSplitError(null);
    startTransition(async () => {
      applyOptimistic({ type: "claim", itemId, claimed, me });
      const result = await callAction(() => setMyClaim({ itemId, claimed }));
      if (!result.ok) setSplitError(`Couldn't update "${name}": ${result.error}`);
    });
  }

  // Each sheet shows its own errors; once both are closed, surface them here so
  // a failure that lands after "Done" (and its rollback) isn't silent.
  const pageError = sheetOpen || splitOpen ? null : (error ?? splitError);

  const subtotal = sum(shownItems);
  const unclaimed = sum(shownItems.filter((item) => item.sharers.length === 0));
  // Someone who just joined hasn't claimed anything yet: say what to do.
  const showClaimHint =
    canEdit &&
    me !== undefined &&
    shownItems.length > 0 &&
    !shownItems.some((item) => item.sharers.some((sharer) => sharer.userId === me.id));

  return (
    <>
      {showClaimHint ? (
        <p className="text-center text-body text-cream">
          Tap the dishes you had to claim your share.
        </p>
      ) : null}
      <ReceiptCard title={title} date={meta} subtotal={subtotal} className="mt-4">
        {shownItems.length > 0 ? (
          shownItems.map((item) => (
            <ItemRow
              key={item.id}
              name={item.pending ? `${item.name} · saving…` : item.name}
              price={item.priceSatang}
              sharers={item.sharers}
              onSelect={item.pending ? undefined : () => openSplit(item.id)}
              className={cn(item.pending && "opacity-50")}
            />
          ))
        ) : (
          <li className="px-5 py-8 text-center text-body text-muted-foreground">
            No items yet — tap Add item to start the receipt.
          </li>
        )}
      </ReceiptCard>

      {canEdit ? (
        <Button
          variant="dashed"
          size="lg"
          className="w-full text-cream"
          onClick={() => setSheetOpen(true)}
        >
          Add item +
        </Button>
      ) : (
        <p className="text-center text-caption text-cream/90">
          {settled ? "Settled — everyone's paid." : "Settling up — items are locked."}
        </p>
      )}

      {invite}

      {pageError ? (
        <p role="alert" className="rounded-lg bg-paper px-4 py-3 text-body text-primary">
          {pageError}
        </p>
      ) : null}

      <div className="flex flex-col items-center gap-1 text-center text-caption text-cream/90">
        <span>Paid by {payerName}</span>
        {unclaimed > 0 ? <span>{formatBaht(unclaimed)} not claimed yet</span> : null}
        {/* 20px apart so the two links' 44px tap areas don't overlap. */}
        <div className="mt-2 flex flex-col items-center gap-5">
          {items.length > 0 ? (
            <Link
              href={`/bills/${billId}/summary`}
              className="text-body text-cream underline underline-offset-4 tap-target"
            >
              See summary →
            </Link>
          ) : null}
          {!canEdit ? (
            <Link
              href={`/bills/${billId}/settle`}
              className="text-body text-cream underline underline-offset-4 tap-target"
            >
              See settle-up →
            </Link>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-5 mt-auto bg-scene-green/95 py-4 backdrop-blur">
        <TotalDisplay label="Running total" amount={subtotal} className="text-white" />
      </div>

      <AddItemSheet
        billId={billId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onOptimisticAdd={onOptimisticAdd}
        error={error}
        onError={setError}
      />

      <ItemSplitSheet
        open={splitOpen}
        item={
          splitTarget && {
            name: splitTarget.name,
            priceSatang: splitTarget.priceSatang,
            splits: splitTarget.sharers.map(({ userId, shares }) => ({ userId, shares })),
          }
        }
        members={members}
        currentUserId={currentUserId}
        canEdit={canEdit && me !== undefined}
        onClaimChange={onClaimChange}
        error={splitError}
        onOpenChange={setSplitOpen}
      />
    </>
  );
}

export { BillItems };
