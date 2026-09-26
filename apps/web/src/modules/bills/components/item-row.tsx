import type * as React from "react";
import { cn } from "cn";
import { Avatar } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { formatBaht } from "@/lib/format";

type Sharer = { initials: string };

/** One line on the receipt: name + price, plus who split it and the per-head hint.
 *  Renders as an <li> — use inside ReceiptCard's list. */
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
  const each = sharers.length > 0 ? Math.round(price / sharers.length) : price;
  return (
    <li className={cn("flex flex-col gap-2 px-5 py-4", className)}>
      <div className="flex items-center justify-between font-body text-md font-bold text-ink">
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
          <span className="font-body text-2xs text-primary">{formatBaht(each)} EACH</span>
        </div>
      ) : null}
    </li>
  );
}

export { ItemRow };
