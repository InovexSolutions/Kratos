-- CreateTable
CREATE TABLE "pterodactyl_servers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "node_id" TEXT NOT NULL,
    "ptero_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pterodactyl_servers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pterodactyl_servers_service_id_key" ON "pterodactyl_servers"("service_id");

-- AddForeignKey
ALTER TABLE "pterodactyl_servers" ADD CONSTRAINT "pterodactyl_servers_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
