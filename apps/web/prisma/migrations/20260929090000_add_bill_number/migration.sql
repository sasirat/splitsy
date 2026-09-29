-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "number" SERIAL NOT NULL;
-- CreateIndex
CREATE UNIQUE INDEX "Bill_number_key" ON "Bill"("number");
