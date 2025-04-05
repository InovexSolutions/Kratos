import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'
import { stripe } from '~/server/services/stripeService'

// Add this helper function
async function getOrCreateCustomer(userId: string): Promise<string> {
  try {
    // Check if the user already has a Stripe customer ID
    const userWithCustomer = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true, name: true }
    });

    // If customer ID exists, return it
    if (userWithCustomer?.stripeCustomerId) {
      return userWithCustomer.stripeCustomerId;
    }

    // Otherwise, create a new customer in Stripe
    const customer = await stripe.customers.create({
      email: userWithCustomer?.email || undefined,
      name: userWithCustomer?.name || undefined,
      metadata: {
        userId: userId
      }
    });

    // Save the customer ID to the user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customer.id
      }
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    throw new Error('Failed to process customer information');
  }
}

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const session = await auth.api.getSession({
    headers: event.headers
  })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const user = session.user
  const { mode } = await readBody(event) || { mode: 'subscription' };

  // Get user's cart
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { plan: true } } }
  });

  if (!cart || cart.items.length === 0) {
    throw createError({ statusCode: 400, message: "Your cart is empty" });
  }

  console.log(`Creating session for ${mode}`);

  // For subscriptions, create a SetupIntent
  if (mode === 'subscription') {
    try {
      // Existing setup intent code...
      const setupIntent = await stripe.setupIntents.create({
        payment_method_types: ['card', 'paypal'],
        usage: 'off_session',
        customer: await getOrCreateCustomer(user.id),
        metadata: {
          userId: user.id,
          cartId: cart.id
        }
      });

      console.log('Setup intent created:', setupIntent.id);

      if (!setupIntent || !setupIntent.client_secret) {
        throw createError({
          statusCode: 500,
          message: 'Failed to create payment setup'
        });
      }

      return {
        sessionId: setupIntent.id,
        clientSecret: setupIntent.client_secret
      };
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw createError({
        statusCode: 500,
        message: `Payment initialization failed: ${error.message || 'Unknown error'}`
      });
    }
  } else {

    // Calculate total amount
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + (Number(item.unitPrice) * item.quantity),
      0
    )

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      metadata: {
        userId: user.id,
        cartId: cart.id
      }
    })

    console.log('Payment intent created:', paymentIntent.id)

    if (!paymentIntent.client_secret) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create payment session'
      })
    }

    return {
      sessionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount
    }
  }
})