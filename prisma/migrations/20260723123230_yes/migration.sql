/*
  Warnings:

  - You are about to drop the column `storeId` on the `Store` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Store_storeId_key";

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "storeId";
