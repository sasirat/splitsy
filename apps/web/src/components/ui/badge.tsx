import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "cn";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-sm border px-2 py-0.5 font-body text-2xs font-bold uppercase whitespace-nowrap",
  {
    variants: {
      variant: {
        owe: "border-primary bg-blush text-primary",
        paid: "border-primary bg-paper text-primary",
        neutral: "border-border bg-white text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "owe",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
