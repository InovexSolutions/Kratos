import { JsonObject } from "@prisma/client/runtime/library"
import { prisma } from "~/server/lib/prisma"
import { getServerSession } from '#auth'
import { stripe } from "~/server/services/stripeService"


// server/api/cart/checkout.post.ts
export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    const user = session?.user
    if (!user) throw createError({ statusCode: 401 })
  
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: { plan: true } } }
    })
  
    if (!cart || cart.items.length === 0) {
      throw createError({ statusCode: 400, message: 'Cart is empty' })
    }
  
    // Create order from cart
    const order = await prisma.$transaction(async (tx) => {
      // Calculate total
      const total = cart.items.reduce((sum, item) => {
        return sum + item.plan.priceMonthly.toNumber() * item.quantity
      }, 0)
  
      // Create order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          status: 'UNPAID',
          totalAmount: total,
          items: {
            create: cart.items.map(item => ({
              planId: item.planId,
              configuration: item.configuration as JsonObject,
              unitPrice: item.plan.priceMonthly,
              quantity: item.quantity
            }))
          }
        }
      })

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: user.email,
        client_reference_id: order.id,
        line_items: cart.items.map(item => ({
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.plan.name,
              description: `Configuration: ${JSON.stringify(item.configuration)}`,
              metadata: {
                planId: item.planId,
                serviceType: item.plan.serviceType
              }
            },
            unit_amount: Math.round(Number(item.unitPrice) * 100),
            recurring: { // Required for subscription mode
              interval: "month", // e.g. 'month' or 'year'
              // interval_count: item.plan.billingIntervalCount || 1
            }
      
          },
          quantity: item.quantity
        })),
        success_url: `${process.env.FRONTEND_URL}/dashboard/orders/${order.id}?success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard/orders/${order.id}?canceled=true`
      })
      console.log('session', session)

      // Update order with Stripe session ID
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id }
      })
  
      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      await tx.cart.delete({ where: { id: cart.id } })
  
      return { ...updatedOrder, url: session.url }
    })
  
    return order
  })