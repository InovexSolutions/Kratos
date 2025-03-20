import { getServerSession } from '#auth'
import { z } from 'zod'
import { prisma } from '~/server/lib/prisma'

const statusUpdateSchema = z.object({
  hostIds: z.array(z.string().uuid()),
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'RETIRED'])
})

export default defineEventHandler(async (event) => {
  // Check if user is admin
  const session = await getServerSession(event)
  if (!session?.user?.id) throw createError({ statusCode: 401 })
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user?.isAdmin) throw createError({ statusCode: 403, message: 'Admin access required' })

  // Validate request body
  const body = await readBody(event)
  const result = statusUpdateSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.message
    })
  }

  const { hostIds, status } = result.data

  // If setting to RETIRED, check for active services
  if (status === 'RETIRED') {
    const hostsWithServices = await prisma.host.findMany({
      where: {
        id: { in: hostIds },
        services: { some: {} }
      },
      include: {
        services: true
      }
    })

    if (hostsWithServices.length > 0) {
      const hostnames = hostsWithServices.map(h => h.hostname).join(', ')
      throw createError({
        statusCode: 409,
        message: `Cannot retire hosts with active services: ${hostnames}`
      })
    }
  }

  // Update status for all hosts
  try {
    const result = await prisma.host.updateMany({
      where: {
        id: { in: hostIds }
      },
      data: {
        status
      }
    })
    
    return { 
      success: true, 
      message: `Status updated to ${status} for ${result.count} hosts` 
    }
  } catch (error) {
    throw createError({ 
      statusCode: 500, 
      message: 'Failed to update host status' 
    })
  }
})