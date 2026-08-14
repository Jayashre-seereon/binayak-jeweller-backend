-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'TRANSFERRED', 'RETURNED', 'MELTED', 'REFINED', 'DAMAGED');

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "inventoryCode" TEXT NOT NULL,
    "purchaseItemId" INTEGER NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "purchaseType" "PurchaseType" NOT NULL,
    "itemId" INTEGER,
    "productId" INTEGER,
    "metalId" INTEGER,
    "purityId" INTEGER,
    "gradeId" INTEGER,
    "stoneId" INTEGER,
    "grossWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stoneWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dustWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pureWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purity" DOUBLE PRECISION,
    "touchPercentage" DOUBLE PRECISION,
    "fineness" DOUBLE PRECISION,
    "huidNo" TEXT,
    "tagNo" TEXT,
    "barcodeNo" TEXT,
    "barSerialNo" TEXT,
    "assayCertNo" TEXT,
    "location" TEXT,
    "rack" TEXT,
    "box" TEXT,
    "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "itemPhoto" TEXT,
    "narration" TEXT,
    "extraDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_inventoryCode_key" ON "Inventory"("inventoryCode");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_purchaseItemId_key" ON "Inventory"("purchaseItemId");

-- CreateIndex
CREATE INDEX "Inventory_storeId_idx" ON "Inventory"("storeId");

-- CreateIndex
CREATE INDEX "Inventory_purchaseType_idx" ON "Inventory"("purchaseType");

-- CreateIndex
CREATE INDEX "Inventory_status_idx" ON "Inventory"("status");

-- CreateIndex
CREATE INDEX "Inventory_barcodeNo_idx" ON "Inventory"("barcodeNo");

-- CreateIndex
CREATE INDEX "Inventory_tagNo_idx" ON "Inventory"("tagNo");

-- CreateIndex
CREATE INDEX "Inventory_huidNo_idx" ON "Inventory"("huidNo");

-- CreateIndex
CREATE INDEX "Inventory_barSerialNo_idx" ON "Inventory"("barSerialNo");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_metalId_fkey" FOREIGN KEY ("metalId") REFERENCES "Metal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_purityId_fkey" FOREIGN KEY ("purityId") REFERENCES "Purity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_stoneId_fkey" FOREIGN KEY ("stoneId") REFERENCES "Stone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
