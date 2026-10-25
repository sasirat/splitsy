"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberRow } from "@/components/ui/member-row";
import { firstIssue } from "@/lib/action-result";
import { callAction } from "@/lib/call-action";
import { formatBaht } from "@/lib/format";
import { deleteItem, updateItem } from "../actions";
import { updateItemInput } from "../schema";
import { splitItem, type Split } from "../service";

export type SplitMember = { id: string; name: string; initials: string };

type Mode = "split" | "edit" | "delete";

/** Satang as the user would type it back: 120, 120.50. */
const bahtInput = (satang: number) =>
  satang % 100 === 0 ? String(satang / 100) : (satang / 100).toFixed(2);

/** "Who had this?" for one item. Everyone in the group is listed with what
 *  they'd pay, and anyone can tick anyone — one person can do the whole table.
 *  Amounts use the same split math as the bill totals. While the bill is open,
 *  anyone can also fix the item's name or price, or delete it (after a confirm). */
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
  item: { id: string; name: string; priceSatang: number; splits: Split[] } | undefined;
  members: SplitMember[];
  currentUserId: string;
  canEdit: boolean;
  onClaimChange: (userId: string, claimed: boolean) => void;
  error: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const questionId = useId();
  const fieldId = useId();
  const [mode, setMode] = useState<Mode>("split");
  const [editError, setEditError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const amounts = item ? splitItem(item.priceSatang, item.splits) : {};
  const claimers = item?.splits.length ?? 0;
  // You first, then everyone else in join order.
  const ordered = [
    ...members.filter((m) => m.id === currentUserId),
    ...members.filter((m) => m.id !== currentUserId),
  ];
  const tickedNames = ordered
    .filter((m) => m.id in amounts)
    .map((m) => (m.id === currentUserId ? "you" : m.name));

  function show(next: Mode) {
    setEditError(null);
    setMode(next);
  }

  function changeOpen(next: boolean) {
    if (pending) return;
    if (!next) show("split");
    onOpenChange(next);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    const data = new FormData(event.currentTarget);
    const input = {
      itemId: item.id,
      name: String(data.get("name") ?? ""),
      price: String(data.get("price") ?? ""),
    };
    const parsed = updateItemInput.safeParse(input);
    if (!parsed.success) return setEditError(firstIssue(parsed.error));

    setEditError(null);
    startTransition(async () => {
      const result = await callAction(() => updateItem(input));
      if (result.ok) setMode("split");
      else setEditError(result.error);
    });
  }

  function remove() {
    if (!item) return;
    const itemId = item.id;
    setEditError(null);
    startTransition(async () => {
      const result = await callAction(() => deleteItem({ itemId }));
      if (result.ok) {
        setMode("split");
        onOpenChange(false);
      } else setEditError(result.error);
    });
  }

  const title =
    mode === "edit"
      ? "Edit item"
      : mode === "delete"
        ? `Delete ${item?.name}?`
        : (item?.name ?? "");

  return (
    <BottomSheet
      open={open && item !== undefined}
      onOpenChange={changeOpen}
      title={title}
      closeLabel="Done"
    >
      {item && mode === "edit" ? (
        <form onSubmit={save} className="flex flex-col gap-3 pb-6" noValidate>
          <div className="flex gap-3">
            <label className="sr-only" htmlFor={`${fieldId}-name`}>
              Item name
            </label>
            <Input
              id={`${fieldId}-name`}
              name="name"
              defaultValue={item.name}
              maxLength={80}
              autoComplete="off"
              autoFocus
              className="flex-1"
              aria-invalid={editError ? true : undefined}
            />
            <label className="sr-only" htmlFor={`${fieldId}-price`}>
              Price in baht
            </label>
            <Input
              id={`${fieldId}-price`}
              name="price"
              defaultValue={bahtInput(item.priceSatang)}
              inputMode="decimal"
              autoComplete="off"
              className="w-28 text-right"
              aria-invalid={editError ? true : undefined}
            />
          </div>
          <p
            role={editError ? "alert" : undefined}
            className={editError ? "text-body text-primary" : "text-caption text-muted-foreground"}
          >
            {editError ?? "Ticks stay — everyone's share follows the new price."}
          </p>
          <Button type="submit" variant="solid" size="lg" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => show("split")}>
            Cancel
          </Button>
        </form>
      ) : item && mode === "delete" ? (
        <div className="flex flex-col gap-4 pb-6">
          <p className="text-body text-muted-foreground">
            {formatBaht(item.priceSatang)} comes off the bill
            {tickedNames.length > 0 ? `, and ${tickedNames.join(", ")} lose this tick` : ""}.
          </p>
          {editError ? (
            <p role="alert" className="text-body text-primary">
              {editError}
            </p>
          ) : null}
          <Button variant="solid" size="lg" className="w-full" disabled={pending} onClick={remove}>
            {pending ? "Deleting…" : "Delete item"}
          </Button>
          <Button variant="ghost" disabled={pending} onClick={() => show("split")}>
            Keep it
          </Button>
        </div>
      ) : item ? (
        <div className="flex flex-col gap-3 pb-6">
          <p className="text-caption text-muted-foreground">
            {formatBaht(item.priceSatang)} ·{" "}
            {claimers === 0
              ? "not claimed yet"
              : claimers === 1
                ? "one person"
                : `split ${claimers} ways`}
          </p>

          <p id={questionId} className="text-label text-ink">
            Who had this?
          </p>
          <div role="group" aria-labelledby={questionId} className="rounded-lg bg-white">
            {ordered.map((member) => {
              const isMe = member.id === currentUserId;
              return (
                <MemberRow
                  key={member.id}
                  name={isMe ? "You" : member.name}
                  initials={member.initials}
                  amount={amounts[member.id] ?? 0}
                  checked={member.id in amounts}
                  disabled={!canEdit}
                  onCheckedChange={(claimed) => onClaimChange(member.id, claimed)}
                />
              );
            })}
          </div>

          <p
            role={error ? "alert" : undefined}
            className={error ? "text-body text-primary" : "text-caption text-muted-foreground"}
          >
            {error ??
              (canEdit ? "Tick everyone who had some." : "Settling up — claims are locked.")}
          </p>

          {canEdit ? (
            <div className="flex justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => show("edit")}>
                Edit item
              </Button>
              <Button variant="ghost" size="sm" onClick={() => show("delete")}>
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </BottomSheet>
  );
}

export { ItemSplitSheet };
