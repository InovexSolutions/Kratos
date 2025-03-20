// server/api/orders/[id].get.ts
import { z } from 'zod'
import { prisma } from '~/server/lib/prisma'
import { getServerSession } from '#auth'

const paramsSchema = z.object({
  id: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  // Validate request parameters
  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  
  // Get authenticated user
  const session = await getServerSession(event as any)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Fetch the order with relations
  const order = await prisma.order.findUnique({
    where: {
      id: params.id,
      userId: session.user.id // Ensure order belongs to user
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      },
      items: { include: { plan: true } },
      service: true,
      plan: true,
      invoices: true,
      subscription: true
    }
  })

  if (!order) {
    throw createError({ 
      statusCode: 404,
      message: 'Order not found or access denied'
    })
  }

  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
}

  // Transform Decimal fields to numbers
  const transformedOrder = {
    ...order,
    totalAmount: order.totalAmount.toNumber(),
    plan: {
      ...order.plan,
      priceMonthly: order.plan?.priceMonthly?.toNumber()
    },
    invoices: order.invoices.map(invoice => ({
      ...invoice,
      amount: invoice.amount.toNumber()
    }))
  }

  return transformedOrder
})