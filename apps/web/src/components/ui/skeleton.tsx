import type * as React from "react";
import { cn } from "cn";

/** A pulsing placeholder block for loading screens. Size it with className. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-paper/20", className)}
      {...props}
    />
  );
}

export { Skeleton };
