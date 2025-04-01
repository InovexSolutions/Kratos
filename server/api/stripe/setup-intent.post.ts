import { auth } from '~/lib/auth'
import { stripe } from '~/server/services/stripeService'

export default defineEventHandler(async (event) => {
  // Verify user is authenticated
  const session = await auth.api.getSession({
    headers: event.headers
  })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  try {
    // Get or create customer
    let customerId = await getStripeCustomerId(session.user.id)

    // Create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session' // Allow using this payment method for future payments
    })

    return {
      clientSecret: setupIntent.client_secret
    }
  } catch (error) {
    console.error('Error creating setup intent:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create payment setup'
    })
  }
})

// Helper function to get or create Stripe customer ID
async function getStripeCustomerId(userId: any) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId
  }

  // Create a new customer
  const customer = await stripe.customers.create({
    metadata: { userId }
  })

  // Store the customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id }
  })

  return customer.id
}