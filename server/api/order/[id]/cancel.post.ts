import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'
import { stripe } from '~/server/services/stripeService'

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
  const { terminateAtPeriodEnd = false } = await readBody(event)
  
  // Get the order with subscription
  const order = await prisma.order.findUnique({
    where: {
      id,
      userId: user.id
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
    // Update the subscription in Stripe to cancel at period end
    await stripe.subscriptions.update(
      order.subscription.stripeSubscriptionId, 
      { 
        cancel_at_period_end: true,
        metadata: {
          terminateAtPeriodEnd: terminateAtPeriodEnd ? 'true' : 'false'
        }
      }
    )
    
    // Update our database records
    await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        terminateAtPeriodEnd
      }
    })
    
    await prisma.subscription.update({
      where: { stripeSubscriptionId: order.subscription.stripeSubscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date()
      }
    })
    
    // Update service status to reflect cancellation is pending
    if (order.service) {
      await prisma.service.update({
        where: { id: order.service.id },
        data: {
          pendingCancellation: true,
          terminationDate: terminateAtPeriodEnd ? null : undefined
        }
      })
    }
    
    return { 
      success: true,
      terminateAtPeriodEnd,
      message: terminateAtPeriodEnd 
        ? 'Subscription cancelled and will be terminated at the end of billing period' 
        : 'Subscription cancelled and will be paused at the end of billing period'
    }
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    throw createError({ 
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to cancel subscription'
    })
  }
})