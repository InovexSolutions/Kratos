/*
  Warnings:

  - Added the required column `allocated` to the `hosts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `hosts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'UNPAID';

-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "allocated" JSONB NOT NULL,
ADD COLUMN     "type" "ServiceType" NOT NULL;
