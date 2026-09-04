-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "purchaseItemCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseItem_purchaseItemCode_key" ON "PurchaseItem"("purchaseItemCode");
