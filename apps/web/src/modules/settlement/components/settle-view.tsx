import { Badge } from "@/components/ui/badge";
import { formatBaht, formatShortDate, formatTimeAgo, initialsOf, personName } from "@/lib/format";
import type { SettlementDetail } from "../queries";
import { formatAccountNumber } from "../service";
import { ClaimPaidButton } from "./claim-paid-button";
import { CopyButton } from "./copy-button";
import { DebtorRow } from "./debtor-row";
import { PayerDebtorList, type PayerRow } from "./payer-debtor-list";
import { PaymentDetailsCard } from "./payment-details-card";
import type { PaymentDetails } from "./payment-details-sheet";

/** Who owes the payer on a settling bill. The payer sees what's still owed,
 *  how friends pay them, and nudges or marks each friend paid; everyone else
 *  sees what they owe, how to pay it, "I've paid", then the full list. */
function SettleView({
  settlement,
  currentUserId,
}: {
  settlement: SettlementDetail;
  currentUserId: string;
}) {
  const { payer, settlements, payment } = settlement;
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

  if (iAmPayer) {
    const now = new Date();
    const rows: PayerRow[] = settlements.map((s) => {
      const name = personName(s.fromUser);
      return {
        id: s.id,
        name,
        initials: initialsOf(name),
        amountSatang: s.amountSatang,
        paid: s.status === "PAID",
        paidLabel: s.paidAt ? `Paid ${formatShortDate(s.paidAt)}` : null,
        nudgedLabel: s.nudgedAt ? `Nudged ${formatTimeAgo(s.nudgedAt, now)}` : null,
        claimedLabel: s.paidClaimedAt
          ? `Says they've paid · ${formatTimeAgo(s.paidClaimedAt, now)}`
          : null,
      };
    });
    return (
      <div className="flex flex-col gap-4">
        <PayerDebtorList
          billId={settlement.id}
          billTitle={settlement.title}
          rows={rows}
          paymentDetails={<PaymentDetailsCard details={details} />}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {mine ? (
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
            <>
              <PayDetails payerName={payerName} details={details} />
              <ClaimPaidButton
                settlementId={mine.id}
                payerName={payerName}
                claimed={mine.paidClaimedAt !== null}
              />
            </>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-paper px-4 py-3 text-body text-ink">
          You don&apos;t owe anything on this bill.
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-label text-cream/80">Who owes {payerName}</h2>
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
                  paid
                    ? `Paid${s.paidAt ? ` ${formatShortDate(s.paidAt)}` : ""}`
                    : s.paidClaimedAt
                      ? "Says they've paid"
                      : "Waiting to pay"
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
            className="max-h-[75dvh] w-auto max-w-full rounded-lg border border-border bg-white"
          />
        </a>
      ) : null}
    </div>
  );
}

export { SettleView };
