import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'
import { stripe } from '~/server/services/stripeService'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  })
  
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  
  const { id } = event.context.params
  
  // Get the order with subscription
  const order = await prisma.order.findUnique({
    where: {
      id,
      userId: session.user.id
    },
    include: {
      subscription: true,
      service: true
    }
  })
  
  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }
  
  if (!order.subscription?.stripeSubscriptionId) {
    throw createError({ statusCode: 400, message: 'No subscription found for this order' })
  }
  
  try {
    // Update the subscription to remove cancel_at_period_end
    await stripe.subscriptions.update(
      order.subscription.stripeSubscriptionId, 
      {
        cancel_at_period_end: false,
        metadata: {
          terminateAtPeriodEnd: 'false'
        }
      }
    )
    
    // Update our database records
    await prisma.order.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        terminateAtPeriodEnd: false
      }
    })
    
    await prisma.subscription.update({
      where: { stripeSubscriptionId: order.subscription.stripeSubscriptionId },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null
      }
    })
    
    // Update service status
    if (order.service) {
      await prisma.service.update({
        where: { id: order.service.id },
        data: {
          pendingCancellation: false,
          terminationDate: null
        }
      })
    }
    
    return {
      success: true,
      message: 'Subscription has been reactivated successfully'
    }
  } catch (error) {
    console.error('Failed to reactivate subscription:', error)
    throw createError({ 
      statusCode: 500, 
      message: error instanceof Error ? error.message : 'Failed to reactivate subscription'
    })
  }
})