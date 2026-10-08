import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { formatBillDate, formatBillNumber, formatBillTime } from "@/lib/format";
import { SettleView } from "@/modules/settlement/components/settle-view";
import { getSettlement } from "@/modules/settlement/queries";
import { requireOnboardedUser } from "@/server/auth";

export default async function SettlePage({ params }: PageProps<"/bills/[id]/settle">) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const settlement = await getSettlement(id);
  if (!settlement) notFound();
  // Nothing to settle until the payer starts settling from the summary.
  if (settlement.status === "OPEN") redirect(`/bills/${id}/summary`);

  const iAmPayer = settlement.payer.id === user.id;
  const meta = [
    formatBillNumber(settlement.number),
    formatBillDate(settlement.createdAt),
    formatBillTime(settlement.createdAt),
  ].join(" · ");

  return (
    <PhoneFrame scene="sky" className="gap-6 px-5 pt-8 pb-8">
      <Link
        href={`/bills/${id}`}
        className="self-start text-caption text-lagoon underline underline-offset-4 tap-target"
      >
        ← Back to bill
      </Link>

      <header className="flex flex-col gap-1">
        <p className="text-label text-lagoon">{iAmPayer ? "You fronted it" : "Settle up"}</p>
        <h1 className="text-h1 wrap-anywhere text-primary">{settlement.title}</h1>
        <p className="text-caption text-primary/80">{meta}</p>
      </header>

      <SettleView settlement={settlement} currentUserId={user.id} />

      <Link
        href={`/bills/${id}/summary`}
        className="self-center text-body text-lagoon underline underline-offset-4 tap-target"
      >
        See what everyone had →
      </Link>
    </PhoneFrame>
  );
}
