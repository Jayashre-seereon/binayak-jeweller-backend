-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('ADVANCE', 'OLD_JEWELLERY');

-- AlterTable
ALTER TABLE "AdvanceReceive" ADD COLUMN     "adjustedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "customerId" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "adjustedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "adjustmentStatus" TEXT NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "customerId" INTEGER;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customerId" INTEGER;

-- AlterTable
ALTER TABLE "SaleAdvanceAdjustment" ADD COLUMN     "adjustedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "cashierName" TEXT,
ADD COLUMN     "previousBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "remainingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SaleOldGold" ADD COLUMN     "adjustedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "cashierName" TEXT,
ADD COLUMN     "previousBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "remainingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "customerCode" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT DEFAULT 'ODISHA',
    "pan" TEXT,
    "gst" TEXT,
    "idType" TEXT,
    "idNumber" TEXT,
    "storeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAdjustmentLog" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "saleId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "referenceDocNo" TEXT,
    "saleInvoiceNo" TEXT NOT NULL,
    "totalOriginal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previousBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjustedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashierName" TEXT,
    "adjustmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAdjustmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_storeId_idx" ON "Customer"("storeId");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "CustomerAdjustmentLog_customerId_idx" ON "CustomerAdjustmentLog"("customerId");

-- CreateIndex
CREATE INDEX "CustomerAdjustmentLog_saleId_idx" ON "CustomerAdjustmentLog"("saleId");

-- CreateIndex
CREATE INDEX "CustomerAdjustmentLog_storeId_idx" ON "CustomerAdjustmentLog"("storeId");

-- CreateIndex
CREATE INDEX "CustomerAdjustmentLog_referenceId_idx" ON "CustomerAdjustmentLog"("referenceId");

-- CreateIndex
CREATE INDEX "CustomerAdjustmentLog_adjustmentType_idx" ON "CustomerAdjustmentLog"("adjustmentType");

-- CreateIndex
CREATE INDEX "AdvanceReceive_customerId_idx" ON "AdvanceReceive"("customerId");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAdjustmentLog" ADD CONSTRAINT "CustomerAdjustmentLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAdjustmentLog" ADD CONSTRAINT "CustomerAdjustmentLog_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAdjustmentLog" ADD CONSTRAINT "CustomerAdjustmentLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceReceive" ADD CONSTRAINT "AdvanceReceive_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
