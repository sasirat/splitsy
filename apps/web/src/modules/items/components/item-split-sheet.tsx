"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MemberRow } from "@/components/ui/member-row";
import { formatBaht } from "@/lib/format";
import { splitItem, type Split } from "../service";

export type SplitMember = { id: string; name: string; initials: string };

/** "Who had this?" for one item. Everyone in the group is listed with what
 *  they'd pay; only the current user's own row can be ticked (self-report).
 *  Amounts use the same split math as the bill totals. */
function ItemSplitSheet({
  open,
  item,
  members,
  currentUserId,
  canEdit,
  onClaimChange,
  error,
  onOpenChange,
}: {
  open: boolean;
  /** The item being split — kept while closing so the slide-out isn't blank. */
  item: { name: string; priceSatang: number; splits: Split[] } | undefined;
  members: SplitMember[];
  currentUserId: string;
  canEdit: boolean;
  onClaimChange: (claimed: boolean) => void;
  error: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const amounts = item ? splitItem(item.priceSatang, item.splits) : {};
  const claimers = item?.splits.length ?? 0;
  // You first, then everyone else in join order.
  const ordered = [
    ...members.filter((m) => m.id === currentUserId),
    ...members.filter((m) => m.id !== currentUserId),
  ];

  return (
    <BottomSheet
      open={open && item !== undefined}
      onOpenChange={onOpenChange}
      title={item?.name ?? ""}
      closeLabel="Done"
    >
      {item ? (
        <div className="flex flex-col gap-3 pb-6">
          <p className="text-caption text-muted-foreground">
            {formatBaht(item.priceSatang)} ·{" "}
            {claimers === 0
              ? "not claimed yet"
              : claimers === 1
                ? "one person"
                : `split ${claimers} ways`}
          </p>

          <div className="rounded-lg bg-white">
            {ordered.map((member) => {
              const isMe = member.id === currentUserId;
              return (
                <MemberRow
                  key={member.id}
                  name={isMe ? "You" : member.name}
                  initials={member.initials}
                  amount={amounts[member.id] ?? 0}
                  checked={member.id in amounts}
                  disabled={!isMe || !canEdit}
                  onCheckedChange={isMe ? onClaimChange : undefined}
                />
              );
            })}
          </div>

          <p
            role={error ? "alert" : undefined}
            className={error ? "text-body text-primary" : "text-caption text-muted-foreground"}
          >
            {error ??
              (canEdit
                ? "Tick it if you had some — everyone ticks their own."
                : "Settling up — claims are locked.")}
          </p>
        </div>
      ) : null}
    </BottomSheet>
  );
}

export { ItemSplitSheet };
