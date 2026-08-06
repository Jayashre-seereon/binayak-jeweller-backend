-- CreateTable
CREATE TABLE "PartyOpeningBalance" (
    "id" SERIAL NOT NULL,
    "debit" INTEGER,
    "credit" INTEGER,
    "type" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "partymasterId" INTEGER NOT NULL,
    "metalId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartyOpeningBalance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PartyOpeningBalance" ADD CONSTRAINT "PartyOpeningBalance_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyOpeningBalance" ADD CONSTRAINT "PartyOpeningBalance_partymasterId_fkey" FOREIGN KEY ("partymasterId") REFERENCES "Partymaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyOpeningBalance" ADD CONSTRAINT "PartyOpeningBalance_metalId_fkey" FOREIGN KEY ("metalId") REFERENCES "Metal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
