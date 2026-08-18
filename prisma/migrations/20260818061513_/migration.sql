/*
  Warnings:

  - You are about to drop the column `itemCode` on the `Item` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Item_itemCode_key";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "itemCode";
