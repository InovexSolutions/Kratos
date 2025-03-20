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

  // Get host with related data
  const host = await prisma.host.findUnique({
    where: { id },
    include: {
      dataCenter: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      services: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          network: true
        }
      }
    }
  })

  if (!host) {
    throw createError({ statusCode: 404, message: 'Host not found' })
  }

  return host
})