// server/api/orders/[id].get.ts
import { z } from 'zod'
import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'
import { stripe } from '~/server/services/stripeService'

const paramsSchema = z.object({
  id: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  
  // Get authenticated user
  const session = await auth.api.getSession({
    headers: event.headers
  })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  
  // Get the specific order
  const order = await prisma.order.findUnique({
    where: {
      id,
      userId: session.user.id
    },
    include: {
      service: true,
      items: {
        include: {
          plan: true
        }
      },
      invoices: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      subscription: true
    }
  })
  
  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }
  
  // Enhance the response with Stripe data
  let paymentMethod = null
  let nextBillingDate = null
  
  if (order.subscription?.stripeSubscriptionId) {
    try {
      // Get subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(
        order.subscription.stripeSubscriptionId,
        { expand: ['default_payment_method'] }
      )
      
      // Get next billing date
      if (subscription.current_period_end) {
        nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString()
      }
      
      // Get payment method
      if (subscription.default_payment_method) {
        paymentMethod = subscription.default_payment_method
      }
    } catch (error) {
      console.error('Error fetching Stripe data:', error)
    }
  }
  
  return {
    ...order,
    nextBillingDate,
    paymentMethod
  }
})