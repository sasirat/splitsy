import { Badge } from "@/components/ui/badge";
import { TotalDisplay } from "@/modules/bills/components/total-display";
import { formatBaht, formatShortDate, initialsOf, personName } from "@/lib/format";
import type { SettlementDetail } from "../queries";
import { DebtorRow } from "./debtor-row";

/** Who owes the payer on a settling bill. The payer sees "You fronted it" and
 *  what's still owed; everyone else sees what they owe, then the full list. */
function SettleView({
  settlement,
  currentUserId,
}: {
  settlement: SettlementDetail;
  currentUserId: string;
}) {
  const { payer, settlements, totalSatang, paidSatang } = settlement;
  const payerName = personName(payer);
  const iAmPayer = payer.id === currentUserId;
  const mine = settlements.find((s) => s.fromUser.id === currentUserId);

  if (settlements.length === 0) {
    return (
      <p className="rounded-lg bg-paper px-4 py-6 text-center text-body text-ink">
        All settled — nobody owes anything on this bill.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {iAmPayer ? (
        <div className="flex flex-col gap-1">
          <TotalDisplay label="Owed to you" amount={totalSatang - paidSatang} className="px-0" />
          <p className="text-caption text-cream/90">
            {formatBaht(paidSatang)} of {formatBaht(totalSatang)} paid back
          </p>
        </div>
      ) : mine ? (
        <div className="flex flex-col gap-1 rounded-lg bg-paper px-4 py-3 text-ink">
          <div className="flex items-center justify-between gap-3 text-body-bold">
            <span className="min-w-0 wrap-anywhere">You owe {payerName}</span>
            <span className="flex shrink-0 items-center gap-2">
              {formatBaht(mine.amountSatang)}
              <Badge variant={mine.status === "PAID" ? "paid" : "owe"}>
                {mine.status === "PAID" ? "paid" : "owe"}
              </Badge>
            </span>
          </div>
          <p className="text-caption text-muted-foreground">
            {mine.status === "PAID"
              ? `You're all square with ${payerName}.`
              : `Pay ${payerName} directly — they'll mark it paid once it arrives.`}
          </p>
        </div>
      ) : (
        <p className="rounded-lg bg-paper px-4 py-3 text-body text-ink">
          You don&apos;t owe anything on this bill.
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-label text-cream/80">
          {iAmPayer ? "Who owes you" : `Who owes ${payerName}`}
        </h2>
        <div className="overflow-hidden rounded-lg bg-paper">
          {settlements.map((s) => {
            const name = personName(s.fromUser);
            const paid = s.status === "PAID";
            return (
              <DebtorRow
                key={s.id}
                name={s.fromUser.id === currentUserId ? "You" : name}
                initials={initialsOf(name)}
                amount={s.amountSatang}
                status={
                  paid ? `Paid${s.paidAt ? ` ${formatShortDate(s.paidAt)}` : ""}` : "Waiting to pay"
                }
                state={paid ? "paid" : "owe"}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

export { SettleView };
