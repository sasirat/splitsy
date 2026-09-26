import type * as React from "react";
import { cn } from "cn";

/** The big "Total ฿1,350" row shown below the receipt on a colored scene. */
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
    <div className={cn("flex items-center justify-between px-5 font-body text-white", className)}>
      <span className="text-md font-bold uppercase">{label}</span>
      <span className="text-5xl font-bold">฿{amount.toLocaleString()}</span>
    </div>
  );
}

export { TotalDisplay };
