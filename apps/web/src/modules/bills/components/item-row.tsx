import type * as React from "react";
import { cn } from "cn";
import { Avatar } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { formatBaht } from "@/lib/format";
import { splitHint, type Sharer } from "../split-hint";

/** One line on the receipt: name + price (satang), plus who split it and the per-head hint.
 *  `shares` on a sharer weights uneven splits. Renders as an <li> — use inside
 *  ReceiptCard's list. */
function ItemRow({
  name,
  price,
  sharers = [],
  className,
}: {
  name: string;
  price: number;
  sharers?: Sharer[];
  className?: string;
}) {
  return (
    <li className={cn("flex flex-col gap-2 px-5 py-4", className)}>
      <div className="flex items-center justify-between text-amount text-md text-ink">
        <span>{name}</span>
        <span>{formatBaht(price)}</span>
      </div>
      {sharers.length > 0 ? (
        <div className="flex items-center gap-1.5">
          <AvatarStack>
            {sharers.map((s, i) => (
              <Avatar key={`${s.initials}-${i}`} size="sm" tone="pink">
                {s.initials}
              </Avatar>
            ))}
          </AvatarStack>
          <span className="text-caption text-primary">{splitHint(price, sharers)}</span>
        </div>
      ) : null}
    </li>
  );
}

export { ItemRow };
