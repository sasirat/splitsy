import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/ui/phone-frame";
import {
  formatBillDate,
  formatBillNumber,
  formatBillTime,
  initialsOf,
  personName,
} from "@/lib/format";
import { BillItems } from "@/modules/bills/components/bill-items";
import { getBill } from "@/modules/bills/queries";
import { requireOnboardedUser } from "@/server/auth";

export default async function BillPage({ params }: PageProps<"/bills/[id]">) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();

  const meta = [
    formatBillNumber(bill.number),
    formatBillDate(bill.createdAt),
    formatBillTime(bill.createdAt),
  ].join(" · ");

  return (
    <PhoneFrame scene="green" className="gap-6 px-5 pt-8">
      <Link
        href={bill.namedGroup ? `/groups/${bill.namedGroup.id}` : "/"}
        className="self-start text-caption wrap-anywhere text-cream underline underline-offset-4"
      >
        {bill.namedGroup ? `← ${bill.namedGroup.name}` : "← Your bills"}
      </Link>

      <BillItems
        billId={bill.id}
        title={bill.title}
        meta={meta}
        payerName={personName(bill.payer)}
        canEdit={bill.status === "OPEN"}
        currentUserId={user.id}
        members={bill.members.map((member) => {
          const name = personName(member);
          return { id: member.id, name, initials: initialsOf(name) };
        })}
        items={bill.items.map((item) => ({
          id: item.id,
          name: item.name,
          priceSatang: item.priceSatang,
          sharers: item.splits.map((split) => ({
            userId: split.userId,
            initials: initialsOf(personName(split.user)),
            shares: split.shares,
          })),
        }))}
      />
    </PhoneFrame>
  );
}
