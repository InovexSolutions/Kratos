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
  
  if (!event.context.params) {
    throw createError({ statusCode: 400, message: 'Missing order ID' })
  }
  const { id } = event.context.params
  
  // Get the order
  const order = await prisma.order.findUnique({
    where: {
      id,
      userId: user.id
    },
    include: {
      invoices: {
        where: {
          status: 'UNPAID'
        },
        take: 1
      }
    }
  })
  
  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }
  
  if (order.invoices.length === 0) {
    throw createError({ statusCode: 400, message: 'No unpaid invoice found' })
  }
  
  // Create a checkout session for the unpaid invoice
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    client_reference_id: order.id,
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Invoice #${order.invoices[0].id.slice(0, 8)}`,
          description: `Payment for order #${order.id.slice(0, 8)}`
        },
        unit_amount: Math.round(Number(order.invoices[0].amount) * 100)
      },
      quantity: 1
    }],
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/orders/${order.id}?success=true`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/orders/${order.id}?cancelled=true`
  })
  
  // Update the invoice with the session ID
  await prisma.invoice.update({
    where: {
      id: order.invoices[0].id
    },
    data: {
      stripeSessionId: stripeSession.id
    }
  })
  
  return {
    url: stripeSession.url
  }
})