/*
  Warnings:

  - You are about to drop the column `barcodeNo` on the `PurchaseItem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PurchaseItem_barcodeNo_key";

-- AlterTable
ALTER TABLE "PurchaseItem" DROP COLUMN "barcodeNo";
