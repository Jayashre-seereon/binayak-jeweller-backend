/*
  Warnings:

  - You are about to drop the column `box` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `rack` on the `Inventory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "box",
DROP COLUMN "location",
DROP COLUMN "rack";
