import { cn } from "cn";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatBaht, formatBillDate, formatBillNumber } from "@/lib/format";

const STATUS = {
  OPEN: { label: "Open", variant: "neutral" },
  SETTLING: { label: "Settling", variant: "owe" },
  SETTLED: { label: "Settled", variant: "paid" },
} as const;

const LOOK = {
  /** paper card on the blue home scene */
  paper: {
    card: "rounded-xl bg-paper shadow-card",
    meta: "text-muted-foreground",
    title: "text-h4",
    footer: "text-body text-ink",
  },
  /** white card with a berry outline and star stickers (Figma group page) */
  sticker: {
    card: "rounded-lg border border-primary bg-white shadow-[0_4px_4px_rgb(193_190_190/0.25)]",
    meta: "text-pebble",
    title: "text-4xl",
    footer: "text-sm text-primary",
  },
} as const;

/** Star stickers scattered over the sticker card, as % of Figma's 349×111 card. */
const STARS = [
  { src: "/art/star-sticker-blue.svg", className: "top-[10%] left-[81%]" },
  { src: "/art/star-sticker-gray.svg", className: "top-[14%] left-[40%]" },
  { src: "/art/star-sticker-yellow.svg", className: "top-[59%] left-[18%]" },
  { src: "/art/star-sticker-gray.svg", className: "top-[72%] left-[61%]" },
] as const;

/** One bill in a list: number + date, title, status, item count and
 *  subtotal (or how much is paid back once settling), plus its group when it
 *  belongs to one. */
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
  look = "paper",
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
  look?: keyof typeof LOOK;
}) {
  const { label, variant } = STATUS[status];
  const styles = LOOK[look];
  return (
    <Link
      href={`/bills/${id}`}
      className={cn(
        "relative flex flex-col gap-1 overflow-hidden px-5 py-4 transition-[filter] hover:brightness-97 focus-visible:ring-2 focus-visible:ring-blush focus-visible:outline-none",
        styles.card,
      )}
    >
      {look === "sticker"
        ? STARS.map((star, i) => (
            // Decorative; plain <img> keeps the SVG's own size (next/image can't size it).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={star.src}
              alt=""
              aria-hidden
              className={cn(
                "pointer-events-none absolute size-[22px] rotate-[17deg]",
                star.className,
              )}
            />
          ))
        : null}
      <span
        className={cn("relative flex items-center justify-between gap-3 text-caption", styles.meta)}
      >
        <span>
          {formatBillNumber(number)} · {formatBillDate(createdAt)}
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          {groupName ? (
            <Badge variant="neutral" className="max-w-[10rem] truncate">
              {groupName}
            </Badge>
          ) : null}
          <Badge variant={variant}>{label}</Badge>
        </span>
      </span>
      <span className={cn("relative wrap-anywhere text-primary", styles.title)}>{title}</span>
      <span className={cn("relative flex items-center justify-between", styles.footer)}>
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
