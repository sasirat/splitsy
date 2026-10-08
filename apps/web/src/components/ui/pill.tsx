import type * as React from "react";
import { cn } from "cn";

/** The "⚡ everyone!" style pill — at least 44px tall, since it's tapped. */
function Pill({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="pill"
      className={cn(
        "inline-flex min-h-11 items-center gap-1 rounded-full bg-primary px-4 py-2 font-body text-sm font-bold text-white",
        className,
      )}
      {...props}
    />
  );
}

export { Pill };
