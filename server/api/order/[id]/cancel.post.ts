import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const session = await auth.api.getSession({
    headers: event.headers
  })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  
  const user = session.user
  const { id } = event.context.params
  
  // Get the order
  const order = await prisma.order.findUnique({
    where: {
      id,
      userId: user.id
    }
  })
  
  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }
  
  // Update order status to cancelled
  const updatedOrder = await prisma.order.update({
    where: {
      id
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date()
    }
  })
  
  return updatedOrder
})