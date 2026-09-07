/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Design` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Design" DROP CONSTRAINT "Design_categoryId_fkey";

-- AlterTable
ALTER TABLE "Design" DROP COLUMN "categoryId";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "gradeId" INTEGER;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
