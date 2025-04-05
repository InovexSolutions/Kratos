import { auth } from '~/lib/auth'
import { stripe } from '~/server/services/stripeService';
import prisma from '~/lib/prisma';

export default defineEventHandler(async (event) => {
  const { id } = event.context.params || {};
  const { setupIntentId } = await readBody(event);

  // Verify authentication
  const session = await auth.api.getSession({
    headers: event.headers
  });
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  try {
    // Find the order
    const order = await prisma.order.findUnique({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        subscription: true
      }
    });

    if (!order) {
      throw createError({ statusCode: 404, message: 'Order not found' });
    }

    if (!order.subscription?.stripeSubscriptionId) {
      throw createError({ statusCode: 400, message: 'No subscription found for this order' });
    }

    // Get the setup intent
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    if (setupIntent.status !== 'succeeded') {
      throw createError({ statusCode: 400, message: 'Payment setup not complete' });
    }

    if (!setupIntent.payment_method) {
      throw createError({ statusCode: 400, message: 'No payment method provided' });
    }

    // Update the default payment method on the subscription
    const paymentMethodId = typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method.id;
      
    await stripe.subscriptions.update(order.subscription.stripeSubscriptionId, {
      default_payment_method: paymentMethodId
    });

    return { success: true, message: 'Payment method updated successfully' };
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to update payment method: ' + (error.message || 'Unknown error')
    });
  }
});