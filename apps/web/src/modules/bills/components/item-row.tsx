import type * as React from "react";
import { cn } from "cn";
import { Avatar } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { formatBaht } from "@/lib/format";
import { splitHint, type Sharer } from "../split-hint";

/** One line on the receipt: name + price (satang), plus who split it and the per-head hint.
 *  `shares` on a sharer weights uneven splits. Renders as an <li> — use inside
 *  ReceiptCard's list. With `onSelect`, the whole line is a button. */
function ItemRow({
  name,
  price,
  sharers = [],
  onSelect,
  className,
}: {
  name: string;
  price: number;
  sharers?: Sharer[];
  onSelect?: () => void;
  className?: string;
}) {
  const hint = splitHint(price, sharers);
  const content = (
    <>
      <div className="flex items-center justify-between gap-3 text-amount text-md text-ink">
        <span className="min-w-0 break-words">{name}</span>
        <span className="shrink-0">{formatBaht(price)}</span>
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
          {hint ? <span className="text-caption text-primary">{hint}</span> : null}
        </div>
      ) : null}
    </>
  );
  const layout = "flex w-full flex-col gap-2 px-5 py-4";

  return (
    <li className={className}>
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            layout,
            "text-left outline-none focus-visible:bg-primary/5 active:bg-primary/5",
          )}
        >
          {content}
        </button>
      ) : (
        <div className={layout}>{content}</div>
      )}
    </li>
  );
}

export { ItemRow };
