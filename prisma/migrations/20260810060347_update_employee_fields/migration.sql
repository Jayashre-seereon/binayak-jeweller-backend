/*
  Warnings:

  - You are about to drop the column `salary` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "salary",
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "basicSalary" DOUBLE PRECISION,
ADD COLUMN     "dateOfJoining" TIMESTAMP(3),
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "specialAllowance" DOUBLE PRECISION,
ADD COLUMN     "webAddress" TEXT;
