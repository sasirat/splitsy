import type * as React from "react";
import { cn } from "cn";
import { formatBaht } from "@/lib/format";

/** The big "Total ฿1,350" row shown below the receipt. Takes the text color of
 *  its scene from the parent (or className). */
function TotalDisplay({
  label = "Total",
  amount,
  className,
}: {
  label?: string;
  amount: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-5", className)}>
      <span className="text-md font-bold uppercase">{label}</span>
      <span className="text-amount text-5xl">{formatBaht(amount)}</span>
    </div>
  );
}

export { TotalDisplay };
