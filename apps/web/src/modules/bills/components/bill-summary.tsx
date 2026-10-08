import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatBaht } from "@/lib/format";
import type { BillSummary } from "../service";

export type SummaryPerson = { name: string; initials: string };

/** The bill grouped by person: each person's items and share, unclaimed
 *  items, and what's owed to the payer. Plain layout — design pass later. */
function BillSummaryView({
  billId,
  summary,
  people,
  payerId,
  currentUserId,
}: {
  billId: string;
  summary: BillSummary;
  /** Display info by userId. */
  people: Record<string, SummaryPerson>;
  payerId: string;
  currentUserId: string;
}) {
  const who = (userId: string) => people[userId] ?? { name: "Someone", initials: "?" };
  const payerName = who(payerId).name;
  const iAmPayer = currentUserId === payerId;
  const myOwed = summary.people.find((p) => p.userId === currentUserId)?.owesPayerSatang ?? 0;

  const backToBill = (label: string) => (
    <Link href={`/bills/${billId}`} className="underline underline-offset-2">
      {label}
    </Link>
  );

  const nothingClaimed = summary.people.every((person) => person.lines.length === 0);
  if (nothingClaimed && summary.unassignedItems.length === 0) {
    return (
      <div className="rounded-lg bg-paper px-4 py-6 text-center text-body text-ink">
        <p className="text-body-bold">Nothing to summarize yet</p>
        <p className="text-caption text-muted-foreground">{backToBill("Add items on the bill")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {summary.unassignedItems.length > 0 ? (
        <div role="status" className="rounded-lg bg-paper px-4 py-3 text-body text-primary">
          <p className="text-body-bold">
            {formatBaht(summary.unassignedSatang)} not claimed yet — totals aren&apos;t final.
          </p>
          <p className="text-caption wrap-anywhere">
            {summary.unassignedItems.map((item) => item.name).join(", ")} ·{" "}
            {backToBill("Claim on the bill")}
          </p>
        </div>
      ) : null}

      {nothingClaimed ? (
        <p className="rounded-lg bg-paper px-4 py-6 text-center text-body text-muted-foreground">
          Nobody has claimed anything yet — tap items on the bill to tick what you had.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {summary.people.map((person) => {
            const { name, initials } = who(person.userId);
            const isPayer = person.userId === payerId;
            return (
              <li key={person.userId} className="rounded-lg bg-paper px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="lg" tone="pink">
                      {initials}
                    </Avatar>
                    {/* Name and badge wrap as a pair on narrow phones; the
                        name only breaks mid-word if it can't fit a line. */}
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-body-bold break-words text-ink">
                        {person.userId === currentUserId ? "You" : name}
                      </span>
                      {isPayer ? <Badge variant="neutral">Paid the bill</Badge> : null}
                    </span>
                  </div>
                  <span className="shrink-0 text-amount text-md text-ink">
                    {formatBaht(person.totalSatang)}
                  </span>
                </div>

                {person.lines.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-1 border-t border-divider pt-2">
                    {person.lines.map((line) => (
                      <li
                        key={line.itemId}
                        className="flex justify-between gap-3 text-caption text-muted-foreground"
                      >
                        <span className="min-w-0 break-words">
                          {line.name}
                          {line.sharedWith > 1 ? ` · shared by ${line.sharedWith}` : ""}
                        </span>
                        <span className="shrink-0">{formatBaht(line.shareSatang)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-caption text-muted-foreground">Nothing claimed yet</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-1 rounded-lg bg-paper px-4 py-3 text-ink">
        <div className="flex justify-between text-body">
          <span>Subtotal</span>
          <span>{formatBaht(summary.subtotalSatang)}</span>
        </div>
        <div className="flex justify-between text-body-bold">
          {iAmPayer ? (
            <>
              <span>Friends owe you</span>
              <span>{formatBaht(summary.owedToPayerSatang)}</span>
            </>
          ) : (
            <>
              <span>You owe {payerName}</span>
              <span>{formatBaht(myOwed)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { BillSummaryView };
