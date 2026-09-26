import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";
import { cn } from "cn";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(
        "flex h-14 w-full min-w-0 rounded-lg border-[1.5px] border-border bg-white px-4 font-body text-md text-ink outline-none transition-colors placeholder:text-muted focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
