import { prisma } from "~/server/lib/prisma";
import { requireAdminUser } from "~/server/utils/adminAuth";

// server/api/admin/pterodactyl/servers.get.ts
export default defineEventHandler(async (event) => {
    // await requireAdminUser(event);
    
    const servers = await prisma.service.findMany({
      where: {
        type: 'GAME_SERVER'
      }
    });
  
    return servers;
  });