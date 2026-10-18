import "server-only";
import { billAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { settleProgress } from "./service";

const person = { select: { id: true, displayName: true, email: true } } as const;

/** A bill's settle-up for the current user: the payer and who owes them,
 *  biggest debt first. null when missing or not a member. */
export async function getSettlement(billId: string) {
  const user = await requireUser();
  const bill = await getDb().bill.findFirst({
    where: { id: billId, ...billAccessWhere(user.id) },
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      createdAt: true,
      payer: {
        select: {
          ...person.select,
          bankName: true,
          bankAccountNumber: true,
          bankAccountName: true,
          paymentQr: { select: { updatedAt: true } },
        },
      },
      settlements: {
        orderBy: [{ amountSatang: "desc" }, { fromUserId: "asc" }],
        select: {
          id: true,
          amountSatang: true,
          status: true,
          paidAt: true,
          nudgedAt: true,
          paidClaimedAt: true,
          fromUser: person,
        },
      },
    },
  });
  if (!bill) return null;
  const { bankName, bankAccountNumber, bankAccountName, paymentQr, ...payer } = bill.payer;
  const hasBank = bankName !== null && bankAccountNumber !== null && bankAccountName !== null;
  return {
    ...bill,
    payer,
    /** How to pay the payer back; null when they haven't added anything. */
    payment:
      hasBank || paymentQr
        ? {
            bankName: hasBank ? bankName : null,
            accountNumber: hasBank ? bankAccountNumber : null,
            accountName: hasBank ? bankAccountName : null,
            /** Changes when the QR is replaced, to bust image caches. */
            qrVersion: paymentQr ? paymentQr.updatedAt.getTime() : null,
          }
        : null,
    ...settleProgress(bill.settlements),
  };
}

/** A user's payment QR, for the current user only if it's their own or they
 *  share a bill that `userId` paid for and is settling (or settled) — the
 *  only place it's ever shown. null otherwise, or when there's none.
 *  The bytes load only on demand, so an unchanged-image 304 never reads them. */
export async function getPaymentQr(userId: string) {
  const viewer = await requireUser();
  const db = getDb();
  if (viewer.id !== userId) {
    const shared = await db.bill.findFirst({
      where: { payerId: userId, status: { not: "OPEN" }, ...billAccessWhere(viewer.id) },
      select: { id: true },
    });
    if (!shared) return null;
  }
  const qr = await db.paymentQr.findUnique({
    where: { userId },
    select: { mimeType: true, updatedAt: true },
  });
  if (!qr) return null;
  const loadImage = async () =>
    (await db.paymentQr.findUnique({ where: { userId }, select: { image: true } }))?.image ?? null;
  return { ...qr, loadImage };
}

export type SettlementDetail = NonNullable<Awaited<ReturnType<typeof getSettlement>>>;
