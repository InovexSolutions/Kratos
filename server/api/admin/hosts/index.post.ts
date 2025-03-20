import { getServerSession } from '#auth'
import { z } from 'zod'
import { prisma } from '~/server/lib/prisma'
import { calculateAvailableCapacity } from '~/server/utils/capacity-calculator'

const hostSchema = z.object({
  hostname: z.string().min(3).max(100),
  dataCenterId: z.string().uuid(),
  type: z.enum(['GAME_SERVER', 'VPS', 'DEDICATED_SERVER']),
  spec: z.object({
    cpu: z.number().int().positive(),
    ramGB: z.number().int().positive(),
    storageTB: z.number().positive()
  }),
  ownerId: z.string().uuid().optional()
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
  const result = hostSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.message
    })
  }

  // Check if datacenter exists
  const dataCenter = await prisma.dataCenter.findUnique({
    where: { id: result.data.dataCenterId }
  })

  if (!dataCenter) {
    throw createError({ statusCode: 404, message: 'Data center not found' })
  }

  // Check if hostname is unique
  const existingHost = await prisma.host.findUnique({
    where: { hostname: result.data.hostname }
  })

  if (existingHost) {
    throw createError({
      statusCode: 409,
      message: 'Host with this hostname already exists'
    })
  }

  // If ownerId is provided, check if user exists
  if (result.data.ownerId) {
    const owner = await prisma.user.findUnique({
      where: { id: result.data.ownerId }
    })

    if (!owner) {
      throw createError({ statusCode: 404, message: 'Owner not found' })
    }
  }

  // Create host
  const host = await prisma.host.create({
    data: {
      hostname: result.data.hostname,
      dataCenterId: result.data.dataCenterId,
      type: result.data.type,
      spec: result.data.spec,
      allocated: {
        cpu: 0,
        ramGB: 0,
        storageTB: 0
      },
      status: 'AVAILABLE',
      ownerId: result.data.ownerId
    },
    include: {
      dataCenter: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  return host
})