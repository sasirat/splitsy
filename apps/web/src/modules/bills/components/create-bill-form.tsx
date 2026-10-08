"use client";

import { cn } from "cn";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { callAction } from "@/lib/call-action";
import { createBill } from "../actions";

const QUICK_PICKS = [
  { emoji: "🍜", title: "Ramen night" },
  { emoji: "🚕", title: "Taxi home" },
  { emoji: "🛒", title: "7-Eleven" },
] as const;

/** The "new bill" receipt card: name the bill (type or quick-pick), then start.
 *  `date`/`time` are formatted on the server so they match the saved bill.
 *  With `groupId`, the bill starts inside that group. */
function CreateBillForm({ date, time, groupId }: { date: string; time: string; groupId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await callAction(() => createBill({ title, groupId }));
      if (!result.ok) return setError(result.error);
      router.push(`/bills/${result.billId}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-primary bg-white shadow-[0_4px_4px_rgb(193_190_190/0.25)]">
        <div className="flex items-center justify-between bg-blush px-4 py-3 text-label text-primary">
          <span>New bill</span>
          <span>{date}</span>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm text-pebble">
              Bill name
            </label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError(null);
              }}
              placeholder="e.g. Friday dinner"
              maxLength={80}
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "title-error" : undefined}
            />
            {error ? (
              <p id="title-error" role="alert" className="text-body text-primary">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-pebble">Quick pick</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_PICKS.map((pick) => {
                const selected = title === pick.title;
                return (
                  <button
                    key={pick.title}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setTitle(pick.title);
                      setError(null);
                    }}
                    className="rounded-full focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
                  >
                    <Pill
                      className={cn(
                        "border border-primary",
                        selected ? "bg-primary text-white" : "bg-white text-primary",
                      )}
                    >
                      <span aria-hidden>{pick.emoji}</span> {pick.title}
                    </Pill>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-dashed border-primary/50 pt-4">
            <span className="text-sm text-pebble">Time recorded</span>
            <span className="text-body-bold text-primary">{time} · Bangkok</span>
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-auto w-full" disabled={pending}>
        {pending ? "Starting…" : "Start bill"}
      </Button>
    </form>
  );
}

export { CreateBillForm };
