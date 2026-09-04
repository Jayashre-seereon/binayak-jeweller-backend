-- CreateEnum
CREATE TYPE "AdvancePaymentMode" AS ENUM ('CASH', 'ONLINE');

-- CreateTable
CREATE TABLE "AdvanceReceive" (
    "id" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "contactNumber" TEXT,
    "address" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMode" "AdvancePaymentMode" NOT NULL,
    "specification" TEXT,
    "storeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvanceReceive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdvanceReceive_storeId_idx" ON "AdvanceReceive"("storeId");

-- CreateIndex
CREATE INDEX "AdvanceReceive_contactNumber_idx" ON "AdvanceReceive"("contactNumber");

-- CreateIndex
CREATE INDEX "AdvanceReceive_customerName_idx" ON "AdvanceReceive"("customerName");

-- AddForeignKey
ALTER TABLE "AdvanceReceive" ADD CONSTRAINT "AdvanceReceive_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
