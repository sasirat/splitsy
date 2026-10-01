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
import { BillSummaryView, type SummaryPerson } from "@/modules/bills/components/bill-summary";
import { getBill } from "@/modules/bills/queries";
import { billSummary } from "@/modules/bills/service";
import { requireOnboardedUser } from "@/server/auth";

export default async function BillSummaryPage({ params }: PageProps<"/bills/[id]/summary">) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();

  // Everyone who appears on the bill: members, the payer, and past sharers.
  const people: Record<string, SummaryPerson> = {};
  const everyone = [
    bill.payer,
    ...bill.members,
    ...bill.items.flatMap((i) => i.splits.map((s) => s.user)),
  ];
  for (const person of everyone) {
    const name = personName(person);
    people[person.id] = { name, initials: initialsOf(name) };
  }

  const meta = [
    formatBillNumber(bill.number),
    formatBillDate(bill.createdAt),
    formatBillTime(bill.createdAt),
  ].join(" · ");

  return (
    <PhoneFrame scene="berry" className="gap-6 px-5 pt-8 pb-8">
      <Link
        href={`/bills/${bill.id}`}
        className="self-start text-caption text-cream underline underline-offset-4"
      >
        ← Back to bill
      </Link>

      <header className="flex flex-col gap-1">
        <p className="text-label text-cream/80">Summary</p>
        <h1 className="text-h1 text-white">{bill.title}</h1>
        <p className="text-caption text-cream/80">{meta}</p>
      </header>

      <BillSummaryView
        billId={bill.id}
        summary={billSummary(bill.items, bill.members, bill.payerId)}
        people={people}
        payerId={bill.payerId}
        currentUserId={user.id}
      />
    </PhoneFrame>
  );
}
