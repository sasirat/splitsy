import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-body font-bold whitespace-nowrap outline-none transition-[filter,background-color,color] select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        // blush pill, berry text — "Continue with Google", "Review bill"
        primary: "bg-blush text-primary shadow-button hover:brightness-95",
        // berry pill, white text — "Add item"
        solid: "bg-primary text-white hover:brightness-110",
        // dashed outline, inherits text color — "more item?", "Share my PromptPay"
        dashed: "border border-dashed border-current bg-transparent hover:bg-current/5",
        ghost: "bg-transparent text-primary hover:bg-blush/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-base",
        default: "h-11 px-6 text-lg",
        lg: "h-14 px-8 text-xl",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
