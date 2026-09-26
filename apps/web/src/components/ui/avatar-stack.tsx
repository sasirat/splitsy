import type * as React from "react";
import { cn } from "cn";
import { Avatar, type avatarVariants } from "./avatar";
import type { VariantProps } from "class-variance-authority";

type AvatarSize = VariantProps<typeof avatarVariants>["size"];

/** Overlapping row of avatars, with an optional "+N" at the end. */
function AvatarStack({
  className,
  children,
  extra,
  size = "md",
}: {
  className?: string;
  children: React.ReactNode;
  extra?: number;
  size?: AvatarSize;
}) {
  return (
    <div className={cn("flex items-center -space-x-1.5", className)}>
      {children}
      {extra ? (
        <Avatar size={size} tone="white">
          +{extra}
        </Avatar>
      ) : null}
    </div>
  );
}

export { AvatarStack };
