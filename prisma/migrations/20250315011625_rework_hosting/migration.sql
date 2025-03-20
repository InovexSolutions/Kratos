/*
  Warnings:

  - The values [COMPLETED,CANCELED,PAUSED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `due_date` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `server_id` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `billing_cycle` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `po_number` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `server_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `company_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `street_address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `street_address_2` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tax_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `zip_code` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `PriceModifier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PricingTier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `servers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `service_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('GAME_SERVER', 'VPS', 'DEDICATED_SERVER');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'RETIRED');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "PriceModifier" DROP CONSTRAINT "PriceModifier_product_id_fkey";

-- DropForeignKey
ALTER TABLE "PricingTier" DROP CONSTRAINT "PricingTier_product_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_product_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_server_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_product_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_server_id_fkey";

-- DropForeignKey
ALTER TABLE "servers" DROP CONSTRAINT "servers_user_id_fkey";

-- DropIndex
DROP INDEX "orders_server_id_idx";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "due_date",
DROP COLUMN "metadata",
DROP COLUMN "payment_method",
DROP COLUMN "product_id",
DROP COLUMN "server_id",
ADD COLUMN     "period_end" TIMESTAMP(6),
ADD COLUMN     "period_start" TIMESTAMP(6),
ADD COLUMN     "service_id" UUID,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "billing_cycle",
DROP COLUMN "end_date",
DROP COLUMN "po_number",
DROP COLUMN "product_id",
DROP COLUMN "server_id",
DROP COLUMN "start_date",
ADD COLUMN     "plan_id" UUID,
ADD COLUMN     "service_id" UUID,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "service_id" UUID NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "city",
DROP COLUMN "company_name",
DROP COLUMN "country",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "phone_number",
DROP COLUMN "state",
DROP COLUMN "street_address",
DROP COLUMN "street_address_2",
DROP COLUMN "tax_id",
DROP COLUMN "zip_code",
ADD COLUMN     "billingAddress" JSONB;

-- DropTable
DROP TABLE "PriceModifier";

-- DropTable
DROP TABLE "PricingTier";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "servers";

-- CreateTable
CREATE TABLE "data_centers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hosts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hostname" TEXT NOT NULL,
    "data_center_id" UUID NOT NULL,
    "spec" JSONB NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "owner_id" UUID,

    CONSTRAINT "hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ServiceType" NOT NULL,
    "user_id" UUID NOT NULL,
    "host_id" UUID,
    "config" JSONB NOT NULL,
    "termination_date" TIMESTAMP(3),
    "renewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_type" "ServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "config_template" JSONB NOT NULL,
    "price_hourly" DECIMAL(10,4) NOT NULL,
    "price_monthly" DECIMAL(10,4) NOT NULL,
    "specs" JSONB NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "ipv4" TEXT,
    "ipv6" TEXT,
    "ports" JSONB,

    CONSTRAINT "network_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_centers_name_key" ON "data_centers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hosts_hostname_key" ON "hosts"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_name_key" ON "pricing_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "network_configs_service_id_key" ON "network_configs"("service_id");

-- CreateIndex
CREATE INDEX "orders_service_id_idx" ON "orders"("service_id");

-- AddForeignKey
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_data_center_id_fkey" FOREIGN KEY ("data_center_id") REFERENCES "data_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_configs" ADD CONSTRAINT "network_configs_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "pricing_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
