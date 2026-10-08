import type * as React from "react";
import { cn } from "cn";

const TONE = {
  /** on dark scenes (blue, green) */
  dark: "bg-paper/20",
  /** on light scenes (sky, petal, cream) */
  light: "bg-ink/10",
} as const;

/** A pulsing placeholder block for loading screens. Size it with className. */
function Skeleton({
  className,
  tone = "dark",
  ...props
}: React.ComponentProps<"div"> & { tone?: keyof typeof TONE }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md", TONE[tone], className)}
      {...props}
    />
  );
}

export { Skeleton };
