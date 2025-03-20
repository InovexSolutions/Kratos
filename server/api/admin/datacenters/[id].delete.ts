import { prisma } from '~/server/lib/prisma'

export default defineEventHandler(async (event) => {
  // Check if user is admin
  const session = await getServerSession(event)
  if (!session?.user?.id) throw createError({ statusCode: 401 })
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user?.isAdmin) throw createError({ statusCode: 403, message: 'Admin access required' })

  // Get datacenter ID from path
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing datacenter ID' })

  // Check for existing hosts in datacenter
  const hostsCount = await prisma.host.count({
    where: { dataCenterId: id }
  })

  if (hostsCount > 0) {
    throw createError({ 
      statusCode: 409, 
      message: `Cannot delete datacenter that has ${hostsCount} hosts. Remove all hosts first.` 
    })
  }

  // Delete datacenter
  try {
    await prisma.dataCenter.delete({
      where: { id }
    })
    
    return { success: true, message: 'Data center deleted successfully' }
  } catch (error) {
    throw createError({ 
      statusCode: 500, 
      message: 'Failed to delete datacenter' 
    })
  }
})