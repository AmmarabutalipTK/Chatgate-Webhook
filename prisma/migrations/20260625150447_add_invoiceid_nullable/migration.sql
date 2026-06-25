/*
  Warnings:

  - Made the column `responseBody` on table `Delivery` required. This step will fail if there are existing NULL values in that column.
  - Made the column `statusCode` on table `Delivery` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "invoiceId" TEXT,
    "requestBody" TEXT NOT NULL,
    "responseBody" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Delivery" ("createdAt", "event", "id", "requestBody", "responseBody", "statusCode", "success") SELECT "createdAt", "event", "id", "requestBody", "responseBody", "statusCode", "success" FROM "Delivery";
DROP TABLE "Delivery";
ALTER TABLE "new_Delivery" RENAME TO "Delivery";
CREATE INDEX "Delivery_invoiceId_idx" ON "Delivery"("invoiceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
