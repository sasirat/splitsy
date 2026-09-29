"use client";

import { useRef, useTransition, type FormEvent } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firstIssue } from "@/lib/action-result";
import { addItem } from "../actions";
import { addItemInput } from "../schema";

export type NewItem = { name: string; priceSatang: number };

const FORM_ID = "add-item-form";

/** "Add item" sheet built for rapid entry: after each add the fields clear and
 *  focus returns to Name, so you can keep tapping. Items appear immediately via
 *  `onOptimisticAdd`; the server confirms in the background. */
function AddItemSheet({
  billId,
  open,
  onOpenChange,
  onOptimisticAdd,
  error,
  onError,
}: {
  billId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimisticAdd: (item: NewItem) => void;
  error: string | null;
  onError: (error: string | null) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = {
      billId,
      name: String(data.get("name") ?? ""),
      price: String(data.get("price") ?? ""),
    };

    // Same schema as the server, so the optimistic row is always a valid item.
    const parsed = addItemInput.safeParse(input);
    if (!parsed.success) return onError(firstIssue(parsed.error));

    onError(null);
    form.reset();
    nameRef.current?.focus();
    startTransition(async () => {
      onOptimisticAdd({ name: parsed.data.name, priceSatang: parsed.data.price });
      const result = await addItem(input);
      if (!result.ok) onError(`Couldn't add "${parsed.data.name}": ${result.error}`);
    });
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add item"
      closeLabel="Done"
      footer={
        <Button form={FORM_ID} type="submit" variant="solid" size="lg" className="w-full">
          Add item
        </Button>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-3 pb-2" noValidate>
        <div className="flex gap-3">
          <label className="sr-only" htmlFor="item-name">
            Item name
          </label>
          <Input
            ref={nameRef}
            id="item-name"
            name="name"
            placeholder="Item name"
            maxLength={80}
            autoComplete="off"
            autoFocus
            className="flex-1"
            aria-invalid={error ? true : undefined}
            aria-describedby="add-item-hint"
          />
          <label className="sr-only" htmlFor="item-price">
            Price in baht
          </label>
          <Input
            id="item-price"
            name="price"
            placeholder="฿0"
            inputMode="decimal"
            autoComplete="off"
            className="w-28 text-right"
            aria-invalid={error ? true : undefined}
            aria-describedby="add-item-hint"
          />
        </div>
        <p
          id="add-item-hint"
          role={error ? "alert" : undefined}
          className={error ? "text-body text-primary" : "text-caption text-muted-foreground"}
        >
          {error ?? "Keep tapping — tidy names later."}
        </p>
      </form>
    </BottomSheet>
  );
}

export { AddItemSheet };
