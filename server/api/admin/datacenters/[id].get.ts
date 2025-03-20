// server/api/orders/[id].get.ts
import { z } from 'zod'
import { prisma } from '~/server/lib/prisma'
import { getServerSession } from '#auth'

const paramsSchema = z.object({
  id: z.string().uuid()
})

export default defineEventHandler(async (event: any) => {
  // Validate request parameters
  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  
  // Get authenticated user
  const session = await getServerSession(event as any)
  if (!session?.user) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const isAdmin = prisma.user.findFirst({ where: { id: session.user.id, isAdmin: true } })
  if (!isAdmin) throw createError({ statusCode: 403 })

  // Fetch the dataCenter with relations
  const dataCenter = await prisma.dataCenter.findUnique({
    where: {
      id: params.id
    },
    include: {
      hosts: true
    }
  })

  if (!dataCenter) {
    throw createError({ 
      status: 404,
      message: 'Order not found or access denied'
    })
  }

  return dataCenter
})