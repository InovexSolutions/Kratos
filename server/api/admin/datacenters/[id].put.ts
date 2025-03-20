import { getServerSession } from '#auth'
import { z } from 'zod'
import { prisma } from '~/server/lib/prisma'

const dataCenterSchema = z.object({
  name: z.string().min(2).max(100),
  location: z.string().min(2).max(100)
})

export default defineEventHandler(async (event: any) => {
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

  // Validate request body
  const body = await readBody(event)
  const result = dataCenterSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.message
    })
  }

  // Check if datacenter exists
  const existing = await prisma.dataCenter.findUnique({
    where: { id }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Data center not found' })
  }

  // Check for name conflict
  const nameConflict = await prisma.dataCenter.findUnique({
    where: { 
      name: result.data.name,
      NOT: { id }
    }
  })

  if (nameConflict) {
    throw createError({
      statusCode: 409,
      message: 'Another data center with this name already exists'
    })
  }

  // Update datacenter
  const datacenter = await prisma.dataCenter.update({
    where: { id },
    data: {
      name: result.data.name,
      location: result.data.location
    }
  })

  return datacenter
})