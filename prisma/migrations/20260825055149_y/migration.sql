-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "pieces" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "netPayable" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "taxableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PurchasePayment" (
    "id" SERIAL NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "paymentMode" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentChannel" TEXT,
    "transactionId" TEXT,
    "description" TEXT,
    "referenceNo" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "narration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchasePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchasePayment_purchaseId_idx" ON "PurchasePayment"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchasePayment_storeId_idx" ON "PurchasePayment"("storeId");

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
