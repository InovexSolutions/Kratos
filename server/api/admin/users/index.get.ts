import { getServerSession } from "#auth";
import { prisma } from "~/server/lib/prisma";

export default defineEventHandler(async (event) => {
  // Check if user is admin
  const session = await getServerSession(event);
  if (!session?.user?.id) throw createError({ statusCode: 401 });
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  
  if (!user?.isAdmin) throw createError({ statusCode: 403, message: 'Admin access required' });

  // Get users from database
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      pteroUserId: true
    }
  });

  // Format response to match Pterodactyl API structure
  return {
    object: "list",
    data: users.map(user => ({
      object: "user",
      attributes: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        image: user.image,
        pteroUserId: user.pteroUserId,
        // Add any other fields needed by your interface
      }
    }))
  };
});