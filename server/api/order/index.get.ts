import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  })
  // Get authenticated user
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Get user's orders
  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      items: {
        include: {
          plan: true
        }
      },
      invoices: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return orders
})