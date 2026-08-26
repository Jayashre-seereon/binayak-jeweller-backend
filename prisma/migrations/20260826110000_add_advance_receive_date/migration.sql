-- AlterTable
ALTER TABLE "AdvanceReceive" ADD COLUMN "receiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "AdvanceReceive" SET "receiveDate" = "createdAt" WHERE "receiveDate" IS NULL;
