import Link from "next/link";
import { formatBaht, formatBillDate, formatBillNumber } from "@/lib/format";

/** One bill in the home list: number + date, title, item count and subtotal. */
function BillCard({
  id,
  number,
  title,
  createdAt,
  itemCount,
  subtotalSatang,
}: {
  id: string;
  number: number;
  title: string;
  createdAt: Date;
  itemCount: number;
  subtotalSatang: number;
}) {
  return (
    <Link
      href={`/bills/${id}`}
      className="flex flex-col gap-1 rounded-xl bg-paper px-5 py-4 shadow-card transition-[filter] hover:brightness-97 focus-visible:ring-2 focus-visible:ring-blush focus-visible:outline-none"
    >
      <span className="text-caption text-muted-foreground">
        {formatBillNumber(number)} · {formatBillDate(createdAt)}
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
