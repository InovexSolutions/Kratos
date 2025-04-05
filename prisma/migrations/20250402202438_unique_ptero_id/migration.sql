/*
  Warnings:

  - A unique constraint covering the columns `[pteroId]` on the table `pterodactyl_servers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pterodactyl_servers_pteroId_key" ON "pterodactyl_servers"("pteroId");
