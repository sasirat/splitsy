import { Badge } from "@/components/ui/badge";
import { TotalDisplay } from "@/modules/bills/components/total-display";
import { formatBaht, formatShortDate, initialsOf, personName } from "@/lib/format";
import type { SettlementDetail } from "../queries";
import { formatAccountNumber } from "../service";
import { CopyButton } from "./copy-button";
import { DebtorRow } from "./debtor-row";
import { MarkPaidButton } from "./mark-paid-button";
import { PaymentDetailsCard } from "./payment-details-card";
import type { PaymentDetails } from "./payment-details-sheet";

/** Who owes the payer on a settling bill. The payer sees "You fronted it",
 *  what's still owed, how friends pay them, and marks each friend paid;
 *  everyone else sees what they owe, how to pay it, then the full list. */
function SettleView({
  settlement,
  currentUserId,
}: {
  settlement: SettlementDetail;
  currentUserId: string;
}) {
  const { payer, settlements, totalSatang, paidSatang, payment } = settlement;
  const payerName = personName(payer);
  const iAmPayer = payer.id === currentUserId;
  const mine = settlements.find((s) => s.fromUser.id === currentUserId);
  const details: PaymentDetails | null = payment && {
    bankName: payment.bankName,
    accountNumber: payment.accountNumber,
    accountName: payment.accountName,
    qrUrl: payment.qrVersion ? `/payment-qr/${payer.id}?v=${payment.qrVersion}` : null,
  };

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
        <>
          <div className="flex flex-col gap-1">
            <TotalDisplay label="Owed to you" amount={totalSatang - paidSatang} className="px-0" />
            <p className="text-caption text-cream/90">
              {paidSatang === totalSatang
                ? "Everyone has paid you back — all settled."
                : `${formatBaht(paidSatang)} of ${formatBaht(totalSatang)} paid back`}
            </p>
          </div>
          <PaymentDetailsCard details={details} />
        </>
      ) : mine ? (
        <div className="flex flex-col gap-3 rounded-lg bg-paper px-4 py-3 text-ink">
          <div className="flex items-center justify-between gap-3 text-body-bold">
            <span className="min-w-0 wrap-anywhere">You owe {payerName}</span>
            <span className="flex shrink-0 items-center gap-2">
              {formatBaht(mine.amountSatang)}
              <Badge variant={mine.status === "PAID" ? "paid" : "owe"}>
                {mine.status === "PAID" ? "paid" : "owe"}
              </Badge>
            </span>
          </div>
          {mine.status === "PAID" ? (
            <p className="text-caption text-muted-foreground">
              You&apos;re all square with {payerName}.
            </p>
          ) : (
            <PayDetails payerName={payerName} details={details} />
          )}
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
                action={
                  iAmPayer ? <MarkPaidButton settlementId={s.id} paid={paid} name={name} /> : null
                }
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

/** How to pay the payer: bank account with Copy, and their QR (tap to open
 *  full size, e.g. to save it for a bank app). */
function PayDetails({ payerName, details }: { payerName: string; details: PaymentDetails | null }) {
  if (!details) {
    return (
      <p className="text-caption text-muted-foreground">
        {payerName} hasn&apos;t added payment details yet — ask them how to pay.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3 border-t border-divider pt-3">
      <p className="text-label text-muted-foreground">Pay {payerName}</p>
      {details.accountNumber ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-caption text-muted-foreground">{details.bankName}</span>
            <span className="text-amount text-md text-ink">
              {formatAccountNumber(details.accountNumber)}
            </span>
            <span className="text-caption wrap-anywhere text-muted-foreground">
              {details.accountName}
            </span>
          </div>
          <CopyButton value={details.accountNumber} label="Copy account number" />
        </div>
      ) : null}
      {details.qrUrl ? (
        <a href={details.qrUrl} target="_blank" rel="noopener" className="self-center">
          {/* A user upload served from our own route — next/image adds nothing here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={details.qrUrl}
            alt={`${payerName}'s payment QR`}
            className="size-56 rounded-lg border border-border bg-white object-contain"
          />
        </a>
      ) : null}
    </div>
  );
}

export { SettleView };
