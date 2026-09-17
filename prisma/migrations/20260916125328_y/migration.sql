/*
  Warnings:

  - You are about to drop the column `itemId` on the `Stone` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Stone` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Stone" DROP CONSTRAINT "Stone_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Stone" DROP CONSTRAINT "Stone_productId_fkey";

-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "productId" INTEGER;

-- AlterTable
ALTER TABLE "Stone" DROP COLUMN "itemId",
DROP COLUMN "productId",
ADD COLUMN     "clarity" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "shape" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "stoneType" TEXT,
ADD COLUMN     "unit" TEXT DEFAULT 'PCS';

-- CreateTable
CREATE TABLE "DesignStone" (
    "id" SERIAL NOT NULL,
    "designId" INTEGER NOT NULL,
    "stoneId" INTEGER NOT NULL,
    "pieces" INTEGER NOT NULL DEFAULT 1,
    "expectedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT DEFAULT 'ct',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignStone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItemStone" (
    "id" SERIAL NOT NULL,
    "purchaseItemId" INTEGER NOT NULL,
    "stoneId" INTEGER,
    "stoneName" TEXT,
    "expectedPieces" INTEGER DEFAULT 0,
    "expectedWeight" DOUBLE PRECISION DEFAULT 0,
    "actualPieces" INTEGER DEFAULT 0,
    "actualWeight" DOUBLE PRECISION DEFAULT 0,
    "rate" DOUBLE PRECISION DEFAULT 0,
    "amount" DOUBLE PRECISION DEFAULT 0,
    "unit" TEXT DEFAULT 'ct',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseItemStone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignStone_designId_idx" ON "DesignStone"("designId");

-- CreateIndex
CREATE INDEX "DesignStone_stoneId_idx" ON "DesignStone"("stoneId");

-- CreateIndex
CREATE INDEX "PurchaseItemStone_purchaseItemId_idx" ON "PurchaseItemStone"("purchaseItemId");

-- CreateIndex
CREATE INDEX "PurchaseItemStone_stoneId_idx" ON "PurchaseItemStone"("stoneId");

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignStone" ADD CONSTRAINT "DesignStone_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignStone" ADD CONSTRAINT "DesignStone_stoneId_fkey" FOREIGN KEY ("stoneId") REFERENCES "Stone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItemStone" ADD CONSTRAINT "PurchaseItemStone_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItemStone" ADD CONSTRAINT "PurchaseItemStone_stoneId_fkey" FOREIGN KEY ("stoneId") REFERENCES "Stone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
