import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "cn";

const phoneFrameVariants = cva("mx-auto flex min-h-dvh w-full max-w-[430px] flex-col", {
  variants: {
    scene: {
      blue: "bg-scene-blue",
      green: "bg-scene-green",
      sky: "bg-scene-sky",
      petal: "bg-scene-petal",
      cream: "bg-cream",
      paper: "bg-paper",
    },
  },
  defaultVariants: {
    scene: "cream",
  },
});

/** The mobile column each screen sits in: full-bleed on phones, centered ~430px
 *  on desktop, with a scene background. No faux iOS status bar — this is a web app. */
function PhoneFrame({
  className,
  scene,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof phoneFrameVariants>) {
  return <div className={cn(phoneFrameVariants({ scene }), className)} {...props} />;
}

export { PhoneFrame };
