-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN "phoneNo" TEXT;

-- CreateIndex
CREATE INDEX "Delivery_phoneNo_createdAt_idx" ON "Delivery"("phoneNo", "createdAt");
