-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "categoryId" INTEGER;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "purityId" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "purityId" INTEGER;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_purityId_fkey" FOREIGN KEY ("purityId") REFERENCES "Purity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_purityId_fkey" FOREIGN KEY ("purityId") REFERENCES "Purity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
