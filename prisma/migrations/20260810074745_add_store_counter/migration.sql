-- CreateTable
CREATE TABLE "StoreCounter" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "lastEmpNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoreCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreCounter_storeId_key" ON "StoreCounter"("storeId");

-- AddForeignKey
ALTER TABLE "StoreCounter" ADD CONSTRAINT "StoreCounter_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
