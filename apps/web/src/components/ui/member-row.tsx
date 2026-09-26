"use client";

import type * as React from "react";
import { cn } from "cn";
import { Avatar } from "./avatar";
import { Checkbox } from "./checkbox";

/** A "who's splitting this?" row: checkbox + avatar + name + per-head amount. */
function MemberRow({
  name,
  initials,
  amount,
  checked,
  onCheckedChange,
  className,
}: {
  name: string;
  initials: string;
  amount: number;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-divider p-4 last:border-b-0",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
        <Avatar size="lg" tone="pink">
          {initials}
        </Avatar>
        <span className="font-body text-base text-ink">{name}</span>
      </div>
      <span className={cn("font-body text-base font-bold", amount > 0 ? "text-ink" : "text-muted")}>
        ฿{amount}
      </span>
    </div>
  );
}

export { MemberRow };
