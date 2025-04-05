-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "terminateAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "pendingCancellation" BOOLEAN NOT NULL DEFAULT false;
