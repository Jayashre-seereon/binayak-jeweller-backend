-- CreateTable
CREATE TABLE "Partymaster" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gst" TEXT,
    "phone" TEXT,
    "storeId" INTEGER NOT NULL,
    "partytypeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partymaster_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Partymaster" ADD CONSTRAINT "Partymaster_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partymaster" ADD CONSTRAINT "Partymaster_partytypeId_fkey" FOREIGN KEY ("partytypeId") REFERENCES "Partytype"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
