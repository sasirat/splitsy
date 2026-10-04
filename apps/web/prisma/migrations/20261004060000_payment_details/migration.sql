-- Replace the unused PromptPay id with bank details (S18).
ALTER TABLE "User" DROP COLUMN "promptPayId",
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT;

-- CreateTable
CREATE TABLE "PaymentQr" (
    "userId" TEXT NOT NULL,
    "image" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentQr_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "PaymentQr" ADD CONSTRAINT "PaymentQr_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
