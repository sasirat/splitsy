"use client";

import type * as React from "react";
import { cn } from "cn";
import { formatBaht } from "@/lib/format";
import { Avatar } from "./avatar";
import { Checkbox } from "./checkbox";

/** A "who's splitting this?" row: checkbox + avatar + name + per-head amount (satang).
 *  The whole row is a <label>, so tapping anywhere toggles the checkbox.
 *  `disabled` shows someone else's claim read-only. */
function MemberRow({
  name,
  initials,
  amount,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  name: string;
  initials: string;
  amount: number;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between border-b border-divider p-4 last:border-b-0",
        disabled ? "cursor-default" : "cursor-pointer",
        className,
      )}
    >
      <span className="flex items-center gap-3">
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        <Avatar size="lg" tone="pink">
          {initials}
        </Avatar>
        <span className="font-body text-base text-ink">{name}</span>
      </span>
      <span
        className={cn(
          "font-body text-base font-bold",
          amount > 0 ? "text-ink" : "text-muted-foreground",
        )}
      >
        {formatBaht(amount)}
      </span>
    </label>
  );
}

export { MemberRow };
