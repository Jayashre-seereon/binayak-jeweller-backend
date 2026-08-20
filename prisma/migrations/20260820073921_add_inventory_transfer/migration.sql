-- CreateEnum
CREATE TYPE "InventoryTransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "InventoryStatus" ADD VALUE 'IN_TRANSIT';

-- AlterTable
ALTER TABLE "StoreCounter" ADD COLUMN     "lastTransferNumber" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "InventoryTransfer" (
    "id" SERIAL NOT NULL,
    "transferNo" TEXT NOT NULL,
    "fromStoreId" INTEGER NOT NULL,
    "toStoreId" INTEGER NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedDate" TIMESTAMP(3),
    "status" "InventoryTransferStatus" NOT NULL DEFAULT 'PENDING',
    "narration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransferItem" (
    "id" SERIAL NOT NULL,
    "transferId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransfer_transferNo_key" ON "InventoryTransfer"("transferNo");

-- CreateIndex
CREATE INDEX "InventoryTransfer_fromStoreId_idx" ON "InventoryTransfer"("fromStoreId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_toStoreId_idx" ON "InventoryTransfer"("toStoreId");

-- CreateIndex
CREATE INDEX "InventoryTransfer_status_idx" ON "InventoryTransfer"("status");

-- CreateIndex
CREATE INDEX "InventoryTransferItem_transferId_idx" ON "InventoryTransferItem"("transferId");

-- CreateIndex
CREATE INDEX "InventoryTransferItem_inventoryId_idx" ON "InventoryTransferItem"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransferItem_transferId_inventoryId_key" ON "InventoryTransferItem"("transferId", "inventoryId");

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_fromStoreId_fkey" FOREIGN KEY ("fromStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_toStoreId_fkey" FOREIGN KEY ("toStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "InventoryTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
