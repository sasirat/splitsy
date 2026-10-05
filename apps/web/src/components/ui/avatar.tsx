import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "cn";

const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full border border-primary font-body font-bold text-primary select-none",
  {
    variants: {
      size: {
        sm: "size-[22px] text-[8px]",
        md: "size-7 text-[9px]",
        lg: "size-8 text-[13px]",
        xl: "size-12 text-lg",
      },
      tone: {
        blush: "bg-blush",
        pink: "bg-pink",
        white: "bg-white",
      },
    },
    defaultVariants: {
      size: "lg",
      tone: "blush",
    },
  },
);

/** Initials avatar. Pass the initials as children. */
function Avatar({
  className,
  size,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof avatarVariants>) {
  return (
    <span data-slot="avatar" className={cn(avatarVariants({ size, tone }), className)} {...props} />
  );
}

export { Avatar, avatarVariants };
