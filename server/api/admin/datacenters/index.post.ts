import { z } from 'zod'
import { getServerSession } from '#auth'
import { prisma } from '~/server/lib/prisma'

// Validation schema
const dataCenterSchema = z.object({
  name: z.string().min(2).max(100),
  location: z.string().min(2).max(100)
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
  const result = dataCenterSchema.safeParse(body)
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.message
    })
  }

  // Check if datacenter with same name already exists
  const existing = await prisma.dataCenter.findUnique({
    where: { name: result.data.name }
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Data center with this name already exists'
    })
  }

  // Create new datacenter
  const datacenter = await prisma.dataCenter.create({
    data: {
      name: result.data.name,
      location: result.data.location
    }
  })

  return datacenter
})