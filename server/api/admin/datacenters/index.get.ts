import { prisma } from '~/server/lib/prisma'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event: any) => {
  // Check if user is admin
  const session = await getServerSession(event)
  if (!session?.user?.id) throw createError({ statusCode: 401 })
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user?.isAdmin) throw createError({ statusCode: 403, message: 'Admin access required' })

  // Get all datacenters
  const datacenters = await prisma.dataCenter.findMany({
    orderBy: { name: 'asc' }
  })

  return datacenters
})