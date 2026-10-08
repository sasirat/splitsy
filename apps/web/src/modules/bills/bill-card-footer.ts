import { formatBaht } from "@/lib/format";
import type { MyBillPart } from "@/modules/settlement/service";

/** A bill card's footer line: the item count while open; once settling, the
 *  viewer's own part — what's paid back to the payer, or what a friend owes. */
export function billCardFooter(itemCount: number, myPart: MyBillPart | null): string {
  if (!myPart) return `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  switch (myPart.role) {
    case "payer":
      if (myPart.totalSatang === 0) return "Nobody owes you";
      return myPart.paidSatang === myPart.totalSatang
        ? "All paid back"
        : `${formatBaht(myPart.paidSatang)} of ${formatBaht(myPart.totalSatang)} paid back`;
    case "debtor":
      return myPart.state === "paid"
        ? `You paid ${formatBaht(myPart.amountSatang)}`
        : myPart.state === "claimed"
          ? `You said you've paid ${formatBaht(myPart.amountSatang)}`
          : `You owe ${formatBaht(myPart.amountSatang)}`;
    case "none":
      return "Nothing to pay";
  }
}
