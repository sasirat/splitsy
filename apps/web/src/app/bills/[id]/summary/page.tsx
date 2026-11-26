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
import { DeleteBillButton } from "@/modules/bills/components/delete-bill-button";
import { getBill } from "@/modules/bills/queries";
import { billSummary } from "@/modules/bills/service";
import { SettleUpButton } from "@/modules/settlement/components/settle-up-button";
import { SettleView } from "@/modules/settlement/components/settle-view";
import { getSettlement } from "@/modules/settlement/queries";
import { requireOnboardedUser } from "@/server/auth";

/** The bill's one summary page. Open: what everyone had, and the payer's
 *  "Settle up". Settling or settled: the settle-up (who owes whom, how to pay,
 *  mark paid / "I've paid") on top, then what everyone had. /settle redirects
 *  here, so reminder links already sent keep working. */
export default async function BillSummaryPage({ params }: PageProps<"/bills/[id]/summary">) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();
  const settling = bill.status !== "OPEN";
  const settlement = settling ? await getSettlement(id) : null;

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

  const summary = billSummary(bill.items, bill.members, bill.payerId);
  const settleBlocked =
    bill.items.length === 0
      ? "Add items before settling up."
      : summary.unassignedItems.length > 0
        ? "Every item needs claiming before you can settle up."
        : undefined;
  const iAmPayer = bill.payerId === user.id;

  const meta = [
    formatBillNumber(bill.number),
    formatBillDate(bill.createdAt),
    formatBillTime(bill.createdAt),
  ].join(" · ");

  const breakdown = (
    <BillSummaryView
      billId={bill.id}
      summary={summary}
      people={people}
      payerId={bill.payerId}
      currentUserId={user.id}
      showOwed={!settling}
    />
  );

  return (
    <PhoneFrame scene="sky" className="gap-6 px-5 pt-8 pb-8">
      <Link
        href={`/bills/${bill.id}`}
        className="self-start text-caption text-lagoon underline underline-offset-4 tap-target"
      >
        ← Back to bill
      </Link>

      <header className="flex flex-col gap-1">
        <p className="text-label text-lagoon">
          {!settling ? "Summary" : iAmPayer ? "You fronted it" : "Settle up"}
        </p>
        <h1 className="text-h1 wrap-anywhere text-primary">{bill.title}</h1>
        <p className="text-caption text-primary/80">{meta}</p>
      </header>

      {settlement ? (
        <>
          <SettleView settlement={settlement} currentUserId={user.id} />
          <section className="flex flex-col gap-2">
            <h2 className="text-label text-lagoon">What everyone had</h2>
            {breakdown}
          </section>
        </>
      ) : (
        <>
          {breakdown}
          {iAmPayer ? <SettleUpButton billId={bill.id} blockedReason={settleBlocked} /> : null}
        </>
      )}

      {/* Until someone has paid the payer, anyone in the bill may delete it. */}
      {bill.canDelete ? (
        <DeleteBillButton
          billId={bill.id}
          title={bill.title}
          itemCount={bill.items.length}
          settling={settling}
          className="mt-2 self-center text-primary/80"
        />
      ) : null}
    </PhoneFrame>
  );
}
