/*
  Warnings:

  - You are about to drop the column `productCode` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Product_productCode_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "productCode";
