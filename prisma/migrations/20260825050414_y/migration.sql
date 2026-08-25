-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "hsnCode" TEXT DEFAULT '711319';

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "hsnCode" TEXT DEFAULT '711319';

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "huidNo" TEXT;
