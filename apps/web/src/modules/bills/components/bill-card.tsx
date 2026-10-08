import { cn } from "cn";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatBaht, formatBillDate, formatBillNumber } from "@/lib/format";

const STATUS = {
  OPEN: { label: "Open", variant: "neutral" },
  SETTLING: { label: "Settling", variant: "owe" },
  SETTLED: { label: "Settled", variant: "paid" },
} as const;

/** Star stickers scattered over the card, after Figma's 349×111 card — kept
 *  off the top row (date, group and status badges) and mostly in the gap
 *  between the item count and the amount. */
const STARS = [
  { src: "/art/star-sticker-blue.svg", className: "top-[38%] right-[6%]" },
  { src: "/art/star-sticker-gray.svg", className: "top-[64%] left-[38%]" },
  { src: "/art/star-sticker-yellow.svg", className: "top-[59%] left-[18%]" },
  { src: "/art/star-sticker-gray.svg", className: "top-[76%] left-[60%]" },
] as const;

/** One bill in a list: number + date, title, status, item count and
 *  subtotal (or how much is paid back once settling), plus its group when it
 *  belongs to one. A white card with a berry outline and star stickers
 *  (Figma group page), used on home and group pages alike. */
function BillCard({
  id,
  number,
  title,
  createdAt,
  itemCount,
  subtotalSatang,
  groupName,
  status,
  progress,
}: {
  id: string;
  number: number;
  title: string;
  createdAt: Date;
  itemCount: number;
  subtotalSatang: number;
  /** Shown as a tag; omit on a group's own page. */
  groupName?: string | null;
  status: keyof typeof STATUS;
  /** Set once settling: how much of what's owed is paid back. */
  progress: { paidSatang: number; totalSatang: number } | null;
}) {
  const { label, variant } = STATUS[status];
  return (
    <Link
      href={`/bills/${id}`}
      className="relative flex flex-col gap-1 overflow-hidden rounded-lg border border-primary bg-white px-5 py-4 shadow-[0_4px_4px_rgb(193_190_190/0.25)] transition-[filter] hover:brightness-97 focus-visible:ring-2 focus-visible:ring-blush focus-visible:outline-none"
    >
      {STARS.map((star, i) => (
        // Tiny decorative SVGs gain nothing from the image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={star.src}
          alt=""
          aria-hidden
          className={cn("pointer-events-none absolute size-[22px] rotate-[17deg]", star.className)}
        />
      ))}
      {/* On narrow phones the badges drop below the date, right-aligned. */}
      <span className="relative flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-pebble">
        <span className="whitespace-nowrap">
          {formatBillNumber(number)} · {formatBillDate(createdAt)}
        </span>
        <span className="ml-auto flex min-w-0 items-center gap-1.5">
          {groupName ? (
            <Badge variant="neutral" className="max-w-[10rem] truncate">
              {groupName}
            </Badge>
          ) : null}
          <Badge variant={variant}>{label}</Badge>
        </span>
      </span>
      <span className="relative text-4xl wrap-anywhere text-primary">{title}</span>
      <span className="relative flex items-center justify-between text-sm text-primary">
        <span>
          {progress && progress.totalSatang > 0 && status === "SETTLING"
            ? `${formatBaht(progress.paidSatang)} of ${formatBaht(progress.totalSatang)} paid back`
            : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
        </span>
        <span className="text-amount text-md">{formatBaht(subtotalSatang)}</span>
      </span>
    </Link>
  );
}

export { BillCard };
