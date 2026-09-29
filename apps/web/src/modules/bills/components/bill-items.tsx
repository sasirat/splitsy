"use client";

import { cn } from "cn";
import { useOptimistic, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatBaht } from "@/lib/format";
import { AddItemSheet, type NewItem } from "@/modules/items/components/add-item-sheet";
import type { Sharer } from "../split-hint";
import { ItemRow } from "./item-row";
import { ReceiptCard } from "./receipt-card";
import { TotalDisplay } from "./total-display";

export type ReceiptItem = {
  id: string;
  name: string;
  priceSatang: number;
  sharers: Sharer[];
  /** Added on this screen, not yet confirmed by the server. */
  pending?: boolean;
};

const sum = (items: ReceiptItem[]) => items.reduce((total, item) => total + item.priceSatang, 0);

/** The bill's receipt with rapid add-item entry and a pinned running total.
 *  New items show instantly (faded) and settle once the server confirms. */
function BillItems({
  billId,
  title,
  meta,
  items,
  payerName,
  canAddItems,
}: {
  billId: string;
  title: string;
  meta: string;
  items: ReceiptItem[];
  payerName: string;
  canAddItems: boolean;
}) {
  const [shownItems, addOptimisticItem] = useOptimistic(items, (current, added: ReceiptItem) => [
    ...current,
    added,
  ]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextPendingId = useRef(0);

  function onOptimisticAdd(item: NewItem) {
    addOptimisticItem({
      ...item,
      id: `pending-${nextPendingId.current++}`,
      sharers: [],
      pending: true,
    });
  }

  const subtotal = sum(shownItems);
  const unclaimed = sum(shownItems.filter((item) => item.sharers.length === 0));

  return (
    <>
      <ReceiptCard title={title} date={meta} subtotal={subtotal} className="mt-4">
        {shownItems.length > 0 ? (
          shownItems.map((item) => (
            <ItemRow
              key={item.id}
              name={item.pending ? `${item.name} · saving…` : item.name}
              price={item.priceSatang}
              sharers={item.sharers}
              className={cn(item.pending && "opacity-50")}
            />
          ))
        ) : (
          <li className="px-5 py-8 text-center text-body text-muted-foreground">
            No items yet — tap Add item to start the receipt.
          </li>
        )}
      </ReceiptCard>

      {canAddItems ? (
        <Button
          variant="dashed"
          size="lg"
          className="w-full text-cream"
          onClick={() => setSheetOpen(true)}
        >
          Add item +
        </Button>
      ) : (
        <p className="text-center text-caption text-cream/90">Settling up — items are locked.</p>
      )}

      {error && !sheetOpen ? (
        <p role="alert" className="rounded-lg bg-paper px-4 py-3 text-body text-primary">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col items-center gap-1 text-center text-caption text-cream/90">
        <span>Paid by {payerName}</span>
        {unclaimed > 0 ? <span>{formatBaht(unclaimed)} not claimed yet</span> : null}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-auto bg-scene-green/95 py-4 backdrop-blur">
        <TotalDisplay label="Running total" amount={subtotal} />
      </div>

      <AddItemSheet
        billId={billId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onOptimisticAdd={onOptimisticAdd}
        error={error}
        onError={setError}
      />
    </>
  );
}

export { BillItems };
