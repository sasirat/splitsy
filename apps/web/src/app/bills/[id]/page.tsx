import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/ui/phone-frame";
import {
  formatBaht,
  formatBillDate,
  formatBillNumber,
  formatBillTime,
  initialsOf,
  personName,
} from "@/lib/format";
import { ItemRow } from "@/modules/bills/components/item-row";
import { ReceiptCard } from "@/modules/bills/components/receipt-card";
import { TotalDisplay } from "@/modules/bills/components/total-display";
import { getBill } from "@/modules/bills/queries";
import { requireOnboardedUser } from "@/server/auth";

// Read-only for now; S10 adds the add-item form here.
export default async function BillPage({ params }: PageProps<"/bills/[id]">) {
  await requireOnboardedUser();
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();

  const { subtotalSatang, unassignedSatang } = bill.totals;
  const meta = [
    formatBillNumber(bill.number),
    formatBillDate(bill.createdAt),
    formatBillTime(bill.createdAt),
  ].join(" · ");

  return (
    <PhoneFrame scene="green" className="gap-6 px-5 pt-8 pb-10">
      <Link href="/" className="self-start text-caption text-cream underline underline-offset-4">
        ← Your bills
      </Link>

      <ReceiptCard title={bill.title} date={meta} subtotal={subtotalSatang} className="mt-4">
        {bill.items.length > 0 ? (
          bill.items.map((item) => (
            <ItemRow
              key={item.id}
              name={item.name}
              price={item.priceSatang}
              sharers={item.splits.map((split) => ({
                initials: initialsOf(personName(split.user)),
                shares: split.shares,
              }))}
            />
          ))
        ) : (
          <li className="px-5 py-8 text-center text-body text-muted-foreground">
            No items yet — adding them comes next.
          </li>
        )}
      </ReceiptCard>

      <TotalDisplay amount={subtotalSatang} />

      <div className="flex flex-col items-center gap-1 text-center text-caption text-cream/90">
        <span>Paid by {personName(bill.payer)}</span>
        {unassignedSatang > 0 ? <span>{formatBaht(unassignedSatang)} not claimed yet</span> : null}
      </div>
    </PhoneFrame>
  );
}
