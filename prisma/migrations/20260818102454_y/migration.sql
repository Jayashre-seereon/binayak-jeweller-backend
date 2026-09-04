/*
  Warnings:

  - A unique constraint covering the columns `[barcodeNo]` on the table `PurchaseItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "barcodeNo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseItem_barcodeNo_key" ON "PurchaseItem"("barcodeNo");
