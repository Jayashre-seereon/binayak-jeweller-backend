-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('RECEIPT', 'PAYMENT', 'JOURNAL');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "StoreCounter" ADD COLUMN     "lastJournalVoucherNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastPaymentVoucherNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReceiptVoucherNumber" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "accountCode" TEXT,
    "accountName" TEXT NOT NULL,
    "accountGroup" TEXT NOT NULL DEFAULT 'General',
    "accountType" TEXT NOT NULL DEFAULT 'EXPENSE',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "narration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "voucherType" "VoucherType" NOT NULL,
    "storeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMode" TEXT,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "referenceDocNo" TEXT,
    "partyType" TEXT,
    "partyId" INTEGER,
    "partyName" TEXT,
    "partyPhone" TEXT,
    "bankName" TEXT,
    "transactionRef" TEXT,
    "narration" TEXT,
    "status" "VoucherStatus" NOT NULL DEFAULT 'COMPLETED',
    "cancelledAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "createdBy" TEXT,
    "customerId" INTEGER,
    "saleId" INTEGER,
    "purchaseId" INTEGER,
    "advanceReceiveId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" SERIAL NOT NULL,
    "voucherId" INTEGER,
    "storeId" INTEGER NOT NULL,
    "accountId" INTEGER,
    "accountName" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "narration" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "VoucherStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_storeId_idx" ON "Account"("storeId");

-- CreateIndex
CREATE INDEX "Account_accountGroup_idx" ON "Account"("accountGroup");

-- CreateIndex
CREATE UNIQUE INDEX "Account_storeId_accountName_key" ON "Account"("storeId", "accountName");

-- CreateIndex
CREATE INDEX "Voucher_storeId_idx" ON "Voucher"("storeId");

-- CreateIndex
CREATE INDEX "Voucher_voucherType_idx" ON "Voucher"("voucherType");

-- CreateIndex
CREATE INDEX "Voucher_status_idx" ON "Voucher"("status");

-- CreateIndex
CREATE INDEX "Voucher_date_idx" ON "Voucher"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_storeId_voucherNo_key" ON "Voucher"("storeId", "voucherNo");

-- CreateIndex
CREATE INDEX "LedgerEntry_storeId_idx" ON "LedgerEntry"("storeId");

-- CreateIndex
CREATE INDEX "LedgerEntry_voucherId_idx" ON "LedgerEntry"("voucherId");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");

-- CreateIndex
CREATE INDEX "LedgerEntry_date_idx" ON "LedgerEntry"("date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Partymaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_advanceReceiveId_fkey" FOREIGN KEY ("advanceReceiveId") REFERENCES "AdvanceReceive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
