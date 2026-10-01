"use client";

import { cn } from "cn";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { callAction } from "@/lib/call-action";
import { createGroup } from "../actions";

const QUICK_PICKS = ["Flatmates", "Office lunch", "Trip crew"] as const;

/** Name a new group (type or quick-pick), then go to it. */
function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await callAction(() => createGroup({ name }));
      if (!result.ok) return setError(result.error);
      router.push(`/groups/${result.groupId}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="group-name" className="text-label text-muted-foreground">
          Group name
        </label>
        <Input
          id="group-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          placeholder="e.g. Flatmates"
          maxLength={60}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "group-name-error" : undefined}
        />
        {error ? (
          <p id="group-name-error" role="alert" className="text-body text-primary">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PICKS.map((pick) => {
          const selected = name === pick;
          return (
            <button
              key={pick}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setName(pick);
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
                {pick}
              </Pill>
            </button>
          );
        })}
      </div>

      <Button type="submit" variant="solid" size="lg" className="mt-auto w-full" disabled={pending}>
        {pending ? "Creating…" : "Create group"}
      </Button>
    </form>
  );
}

export { CreateGroupForm };
