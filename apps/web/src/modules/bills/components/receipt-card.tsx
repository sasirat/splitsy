import Image from "next/image";
import type * as React from "react";
import { cn } from "cn";
import { formatBaht } from "@/lib/format";

const TORN_EDGE_PATH =
  "M0 0V12L8.61539 4L17.2308 12L25.8462 4L34.4615 12L43.0769 4L51.6923 12L60.3077 4L68.9231 12L77.5385 4L86.1539 12L94.7692 4L103.385 12L112 4L120.615 12L129.231 4L137.846 12L146.462 4L155.077 12L163.692 4L172.308 12L180.923 4L189.538 12L198.154 4L206.769 12L215.385 4L224 12L232.615 4L241.231 12L249.846 4L258.462 12L267.077 4L275.692 12L284.308 4L292.923 12L301.538 4L310.154 12L318.769 4L327.385 12L336 4L344.615 12L350 7V0H0Z";

/** The torn bottom edge of the receipt (Figma vector), filled to match the card. */
function TornEdge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 350 12"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("block h-3 w-full text-paper", className)}
    >
      <path d={TORN_EDGE_PATH} fill="currentColor" />
    </svg>
  );
}

/** The cream receipt card: gingham tape on top, dashed-divided items, a subtotal,
 *  and a torn bottom edge. Pass ItemRows as children. */
function ReceiptCard({
  title,
  date,
  subtotal,
  children,
  className,
}: {
  title: string;
  date?: string;
  subtotal: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Image
        src="/art/tape-red.png"
        alt=""
        aria-hidden
        // The file's real size; CSS shows it 150px wide at the same aspect.
        width={900}
        height={236}
        className="pointer-events-none absolute -top-4 left-1/2 z-10 h-auto w-[150px] -translate-x-1/2 -rotate-2 select-none"
      />
      <div className="bg-paper px-4 shadow-card">
        <div className="flex flex-col items-center gap-1 px-5 pt-7 pb-4 text-center text-primary">
          <p className="text-h3 leading-none wrap-anywhere">{title}</p>
          {date ? <p className="text-caption">{date}</p> : null}
        </div>
        <ul className="divide-y divide-dashed divide-primary/50 border-y border-dashed border-primary/50">
          {children}
        </ul>
        <div className="flex items-center justify-between px-5 pt-4 pb-5">
          <span className="text-label text-ink">Subtotal</span>
          <span className="text-amount text-lg text-ink">{formatBaht(subtotal)}</span>
        </div>
      </div>
      <TornEdge className="-mt-px" />
    </div>
  );
}

export { ReceiptCard, TornEdge };
