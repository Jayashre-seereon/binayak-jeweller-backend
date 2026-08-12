-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_partyId_fkey";

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "customerIdNumber" TEXT,
ADD COLUMN     "customerIdType" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "invoiceNo" TEXT,
ADD COLUMN     "isRCM" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "placeOfSupply" TEXT,
ADD COLUMN     "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "updatedById" INTEGER,
ALTER COLUMN "partyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "assayCertNo" TEXT,
ADD COLUMN     "barSerialNo" TEXT,
ADD COLUMN     "deductionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "extraDetails" JSONB,
ADD COLUMN     "fineness" DOUBLE PRECISION,
ADD COLUMN     "hallmarkCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "huidNo" TEXT,
ADD COLUMN     "itemPhoto" TEXT,
ADD COLUMN     "makingCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pieces" INTEGER DEFAULT 1,
ADD COLUMN     "tagNo" TEXT,
ADD COLUMN     "touchPercentage" DOUBLE PRECISION,
ADD COLUMN     "wastagePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Partymaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
