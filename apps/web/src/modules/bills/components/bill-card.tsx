import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatBaht, formatBillDate, formatBillNumber } from "@/lib/format";

/** One bill in a list: number + date, title, item count and subtotal, plus
 *  its group when it belongs to one. */
function BillCard({
  id,
  number,
  title,
  createdAt,
  itemCount,
  subtotalSatang,
  groupName,
}: {
  id: string;
  number: number;
  title: string;
  createdAt: Date;
  itemCount: number;
  subtotalSatang: number;
  /** Shown as a tag; omit on a group's own page. */
  groupName?: string | null;
}) {
  return (
    <Link
      href={`/bills/${id}`}
      className="flex flex-col gap-1 rounded-xl bg-paper px-5 py-4 shadow-card transition-[filter] hover:brightness-97 focus-visible:ring-2 focus-visible:ring-blush focus-visible:outline-none"
    >
      <span className="flex items-center justify-between gap-3 text-caption text-muted-foreground">
        <span>
          {formatBillNumber(number)} · {formatBillDate(createdAt)}
        </span>
        {groupName ? (
          <Badge variant="neutral" className="max-w-[50%] truncate">
            {groupName}
          </Badge>
        ) : null}
      </span>
      <span className="text-h4 wrap-anywhere text-primary">{title}</span>
      <span className="flex items-center justify-between text-body text-ink">
        <span>
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
        <span className="text-amount text-md">{formatBaht(subtotalSatang)}</span>
      </span>
    </Link>
  );
}

export { BillCard };
