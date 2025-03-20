import { getServerSession } from '#auth'
import { prisma } from '~/server/lib/prisma'

export default defineEventHandler(async (event) => {
  // Check if user is admin
  const session = await getServerSession(event)
  if (!session?.user?.id) throw createError({ statusCode: 401 })
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user?.isAdmin) throw createError({ statusCode: 403, message: 'Admin access required' })

  // Get host ID from path
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing host ID' })

  // Check if host exists and has services
  const host = await prisma.host.findUnique({
    where: { id },
    include: {
      services: true
    }
  })

  if (!host) {
    throw createError({ statusCode: 404, message: 'Host not found' })
  }

  // Cannot delete host with active services
  if (host.services.length > 0) {
    throw createError({
      statusCode: 409,
      message: `Cannot delete host with ${host.services.length} active services. Migrate or terminate services first.`
    })
  }

  // Delete host
  try {
    await prisma.host.delete({
      where: { id }
    })
    
    return { success: true, message: 'Host deleted successfully' }
  } catch (error) {
    throw createError({ 
      statusCode: 500, 
      message: 'Failed to delete host' 
    })
  }
})