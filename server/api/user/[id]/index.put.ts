// ~/server/api/user/[id]/index.put.ts
import { prisma } from "~/server/lib/prisma"
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userId = getRouterParam(event, 'id')
  
  // Verify user is updating their own profile
  const session = await getServerSession(event as any)
  if (session?.user?.id !== userId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      streetAddress: body.streetAddress,
      streetAddress2: body.streetAddress2,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      country: body.country,
      companyName: body.companyName,
      taxId: body.taxId
    }
  })

  return updatedUser
})