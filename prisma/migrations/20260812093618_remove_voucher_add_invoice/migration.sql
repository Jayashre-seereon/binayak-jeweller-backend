/*
  Warnings:

  - You are about to drop the column `voucherNo` on the `Purchase` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceNo]` on the table `Purchase` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "voucherNo";

-- AlterTable
ALTER TABLE "StoreCounter" ADD COLUMN     "lastInvoiceNumber" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_invoiceNo_key" ON "Purchase"("invoiceNo");
