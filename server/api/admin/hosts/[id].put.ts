import { z } from 'zod'
import { prisma } from '~/server/lib/prisma'

const hostUpdateSchema = z.object({
  hostname: z.string().min(3).max(100).optional(),
  dataCenterId: z.string().uuid().optional(),
  type: z.enum(['GAME_SERVER', 'VPS', 'DEDICATED_SERVER']).optional(),
  spec: z.object({
    cpu: z.number().int().positive(),
    ramGB: z.number().int().positive(),
    storageTB: z.number().positive()
  }).optional(),
  ownerId: z.string().uuid().nullable().optional(),
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'RETIRED']).optional()
})

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

  // Validate request body
  const body = await readBody(event)
  const result = hostUpdateSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.message
    })
  }

  // Check if host exists and get current state
  const existingHost = await prisma.host.findUnique({
    where: { id },
    include: {
      services: true
    }
  })

  if (!existingHost) {
    throw createError({ statusCode: 404, message: 'Host not found' })
  }

  // Check if hostname is unique if updating it
  if (result.data.hostname && result.data.hostname !== existingHost.hostname) {
    const hostnameExists = await prisma.host.findUnique({
      where: { hostname: result.data.hostname }
    })

    if (hostnameExists) {
      throw createError({
        statusCode: 409,
        message: 'Host with this hostname already exists'
      })
    }
  }

  // Check if datacenter exists if updating it
  if (result.data.dataCenterId) {
    const dataCenter = await prisma.dataCenter.findUnique({
      where: { id: result.data.dataCenterId }
    })

    if (!dataCenter) {
      throw createError({ statusCode: 404, message: 'Data center not found' })
    }
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

  // Check if we can downsize resources based on current allocation
  if (result.data.spec) {
    if (result.data.spec.cpu < existingHost.allocated.cpu) {
      throw createError({
        statusCode: 400,
        message: `Cannot reduce CPU below allocated amount (${existingHost.allocated.cpu})`
      })
    }
    
    if (result.data.spec.ramGB < existingHost.allocated.ramGB) {
      throw createError({
        statusCode: 400,
        message: `Cannot reduce RAM below allocated amount (${existingHost.allocated.ramGB} GB)`
      })
    }
    
    if (result.data.spec.storageTB < existingHost.allocated.storageTB) {
      throw createError({
        statusCode: 400,
        message: `Cannot reduce storage below allocated amount (${existingHost.allocated.storageTB} TB)`
      })
    }
  }

  // Cannot set status to RETIRED if there are active services
  if (result.data.status === 'RETIRED' && existingHost.services.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Cannot retire host with ${existingHost.services.length} active services`
    })
  }

  // Update host
  const host = await prisma.host.update({
    where: { id },
    data: {
      ...(result.data.hostname && { hostname: result.data.hostname }),
      ...(result.data.dataCenterId && { dataCenterId: result.data.dataCenterId }),
      ...(result.data.type && { type: result.data.type }),
      ...(result.data.spec && { spec: result.data.spec }),
      ...(result.data.ownerId !== undefined && { ownerId: result.data.ownerId }),
      ...(result.data.status && { status: result.data.status })
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