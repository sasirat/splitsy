"use client";

import { cn } from "cn";
import { PencilIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { callAction } from "@/lib/call-action";
import { createGroup } from "../actions";

const QUICK_PICKS = ["Flatmates", "Office lunch", "Trip crew"] as const;

/** Name a new group (type or quick-pick), then go to it. The name is written
 *  on a plate (Figma "create-new-group"). */
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
    <form onSubmit={onSubmit} className="flex flex-1 flex-col items-center gap-4">
      {/* Plate on the cloth; the input sits on the plate's rim line. Positions
          are the Figma frame's, as % of the 366×379 art. */}
      <div className="relative -mx-3 mt-4 aspect-[834/864] w-[calc(100%+1.5rem)]">
        <Image
          src="/art/new-group.png"
          alt=""
          fill
          priority
          sizes="(max-width: 430px) 100vw, 430px"
          className="object-contain"
        />
        <div className="absolute top-[44%] right-[22%] bottom-[44%] left-[22%] flex items-center gap-2 border-b-[0.5px] border-primary px-2 focus-within:border-b-2">
          <label htmlFor="group-name" className="sr-only">
            Group name
          </label>
          <Input
            id="group-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="Group name"
            maxLength={60}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "group-name-error" : undefined}
            className="h-full flex-1 rounded-none border-0 bg-transparent px-0 font-mono font-bold text-primary placeholder:text-primary/50"
          />
          <PencilIcon aria-hidden className="size-4 shrink-0 text-primary" />
        </div>
      </div>

      {error ? (
        <p id="group-name-error" role="alert" className="text-center text-body text-primary">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-center gap-2">
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

      <Button type="submit" size="lg" className="mt-auto w-full" disabled={pending}>
        {pending ? "Creating…" : "Create Group +"}
      </Button>
    </form>
  );
}

export { CreateGroupForm };
