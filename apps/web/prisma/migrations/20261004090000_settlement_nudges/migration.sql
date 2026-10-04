-- S19: payer nudges and the debtor's "I've paid".
ALTER TABLE "Settlement" ADD COLUMN     "nudgedAt" TIMESTAMP(3),
ADD COLUMN     "paidClaimedAt" TIMESTAMP(3);
