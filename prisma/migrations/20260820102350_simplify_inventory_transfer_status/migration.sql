/*
  Warnings:

  - The values [IN_TRANSIT] on the enum `InventoryStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [IN_TRANSIT,REJECTED,CANCELLED] on the enum `InventoryTransferStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InventoryStatus_new" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'PENDING', 'TRANSFERRED', 'RETURNED', 'MELTED', 'REFINED', 'DAMAGED');
ALTER TABLE "Inventory" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Inventory" ALTER COLUMN "status" TYPE "InventoryStatus_new" USING ("status"::text::"InventoryStatus_new");
ALTER TYPE "InventoryStatus" RENAME TO "InventoryStatus_old";
ALTER TYPE "InventoryStatus_new" RENAME TO "InventoryStatus";
DROP TYPE "InventoryStatus_old";
ALTER TABLE "Inventory" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "InventoryTransferStatus_new" AS ENUM ('PENDING', 'RECEIVED');
ALTER TABLE "InventoryTransfer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "InventoryTransfer" ALTER COLUMN "status" TYPE "InventoryTransferStatus_new" USING ("status"::text::"InventoryTransferStatus_new");
ALTER TYPE "InventoryTransferStatus" RENAME TO "InventoryTransferStatus_old";
ALTER TYPE "InventoryTransferStatus_new" RENAME TO "InventoryTransferStatus";
DROP TYPE "InventoryTransferStatus_old";
ALTER TABLE "InventoryTransfer" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
