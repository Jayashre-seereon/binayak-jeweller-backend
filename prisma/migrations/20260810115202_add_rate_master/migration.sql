-- CreateTable
CREATE TABLE "RateMaster" (
    "id" SERIAL NOT NULL,
    "metalId" INTEGER NOT NULL,
    "purityId" INTEGER NOT NULL,
    "gradeId" INTEGER,
    "unit" TEXT NOT NULL,
    "saleRate" DOUBLE PRECISION NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "cashRate" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateMaster_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RateMaster" ADD CONSTRAINT "RateMaster_metalId_fkey" FOREIGN KEY ("metalId") REFERENCES "Metal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateMaster" ADD CONSTRAINT "RateMaster_purityId_fkey" FOREIGN KEY ("purityId") REFERENCES "Purity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateMaster" ADD CONSTRAINT "RateMaster_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateMaster" ADD CONSTRAINT "RateMaster_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
