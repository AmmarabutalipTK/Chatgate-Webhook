-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN "clientId" TEXT;
ALTER TABLE "Delivery" ADD COLUMN "clientName" TEXT;

-- CreateIndex
CREATE INDEX "Delivery_clientId_idx" ON "Delivery"("clientId");
