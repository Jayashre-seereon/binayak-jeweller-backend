-- CreateEnum
CREATE TYPE "SalePaymentMode" AS ENUM ('CASH', 'ONLINE', 'CARD', 'UPI', 'CHEQUE', 'OTHER');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "StoreCounter" ADD COLUMN     "lastSaleNumber" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Sale" (
    "id" SERIAL NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "partyId" INTEGER,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
    "customerGst" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oldGoldAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "narration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "pieces" INTEGER NOT NULL DEFAULT 1,
    "grossWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stoneWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purity" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "makingCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wastageAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stoneAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hallmarkCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalePayment" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "paymentMode" "SalePaymentMode" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "referenceNo" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "narration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleOldGold" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER NOT NULL,
    "purchaseId" INTEGER,
    "description" TEXT,
    "grossWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stoneWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purity" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleOldGold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleAdvanceAdjustment" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER NOT NULL,
    "advanceReceiveId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "storeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleAdvanceAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNo_key" ON "Sale"("invoiceNo");

-- CreateIndex
CREATE INDEX "Sale_storeId_idx" ON "Sale"("storeId");

-- CreateIndex
CREATE INDEX "Sale_partyId_idx" ON "Sale"("partyId");

-- CreateIndex
CREATE INDEX "Sale_saleDate_idx" ON "Sale"("saleDate");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_inventoryId_idx" ON "SaleItem"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItem_saleId_inventoryId_key" ON "SaleItem"("saleId", "inventoryId");

-- CreateIndex
CREATE INDEX "SalePayment_saleId_idx" ON "SalePayment"("saleId");

-- CreateIndex
CREATE INDEX "SalePayment_storeId_idx" ON "SalePayment"("storeId");

-- CreateIndex
CREATE INDEX "SaleOldGold_saleId_idx" ON "SaleOldGold"("saleId");

-- CreateIndex
CREATE INDEX "SaleOldGold_purchaseId_idx" ON "SaleOldGold"("purchaseId");

-- CreateIndex
CREATE INDEX "SaleOldGold_storeId_idx" ON "SaleOldGold"("storeId");

-- CreateIndex
CREATE INDEX "SaleAdvanceAdjustment_saleId_idx" ON "SaleAdvanceAdjustment"("saleId");

-- CreateIndex
CREATE INDEX "SaleAdvanceAdjustment_advanceReceiveId_idx" ON "SaleAdvanceAdjustment"("advanceReceiveId");

-- CreateIndex
CREATE INDEX "SaleAdvanceAdjustment_storeId_idx" ON "SaleAdvanceAdjustment"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleAdvanceAdjustment_saleId_advanceReceiveId_key" ON "SaleAdvanceAdjustment"("saleId", "advanceReceiveId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Partymaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOldGold" ADD CONSTRAINT "SaleOldGold_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOldGold" ADD CONSTRAINT "SaleOldGold_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleOldGold" ADD CONSTRAINT "SaleOldGold_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleAdvanceAdjustment" ADD CONSTRAINT "SaleAdvanceAdjustment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleAdvanceAdjustment" ADD CONSTRAINT "SaleAdvanceAdjustment_advanceReceiveId_fkey" FOREIGN KEY ("advanceReceiveId") REFERENCES "AdvanceReceive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleAdvanceAdjustment" ADD CONSTRAINT "SaleAdvanceAdjustment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
