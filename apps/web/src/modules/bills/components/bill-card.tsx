import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatBaht, formatBillDate, formatBillNumber } from "@/lib/format";

const STATUS = {
  OPEN: { label: "Open", variant: "neutral" },
  SETTLING: { label: "Settling", variant: "owe" },
  SETTLED: { label: "Settled", variant: "paid" },
} as const;

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
      className="flex flex-col gap-1 rounded-xl bg-paper px-5 py-4 shadow-card transition-[filter] hover:brightness-97 focus-visible:ring-2 focus-visible:ring-blush focus-visible:outline-none"
    >
      <span className="flex items-center justify-between gap-3 text-caption text-muted-foreground">
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
      <span className="text-h4 wrap-anywhere text-primary">{title}</span>
      <span className="flex items-center justify-between text-body text-ink">
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
