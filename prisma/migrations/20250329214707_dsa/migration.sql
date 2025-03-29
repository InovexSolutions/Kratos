/*
  Warnings:

  - Added the required column `email_verified` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "email_verified",
ADD COLUMN     "email_verified" BOOLEAN NOT NULL;
