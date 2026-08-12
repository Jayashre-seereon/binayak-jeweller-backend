/*
  Warnings:

  - You are about to drop the column `createdById` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Purchase` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "createdById",
DROP COLUMN "updatedById";
