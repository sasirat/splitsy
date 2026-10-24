"use client";

import type * as React from "react";
import { cn } from "cn";
import { formatBaht } from "@/lib/format";
import { Avatar } from "./avatar";
import { Checkbox } from "./checkbox";

/** A "who's splitting this?" row: checkbox + avatar + name + per-head amount (satang).
 *  The whole row is a <label>, so tapping anywhere toggles the checkbox.
 *  `disabled` shows a claim read-only (e.g. once the bill is settling). */
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
      <span className="flex min-w-0 items-center gap-3">
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        {/* The row label names the checkbox: "Ploy ฿45", not "P Ploy ฿45". */}
        <Avatar size="lg" tone="pink" aria-hidden>
          {initials}
        </Avatar>
        <span className="min-w-0 font-body text-base break-words text-ink">{name}</span>
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
