import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  })
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  
  const user = session.user
  
  // Get user's cart
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { 
      items: {
        include: { plan: true }
      }
    }
  })
  
  if (!cart || cart.items.length === 0) {
    throw createError({ 
      statusCode: 400, 
      message: 'Your cart is empty' 
    })
  }
  
  // Create the order from cart items
  const order = await prisma.$transaction(async (tx) => {
    // Calculate total amount
    const total = cart.items.reduce(
      (sum, item) => sum + (Number(item.unitPrice) * item.quantity), 
      0
    )
    
    // Create order
    const order = await tx.order.create({
      data: {
        userId: user.id,
        status: 'UNPAID',
        totalAmount: total,
        items: {
          create: cart.items.map(item => ({
            configuration: item.configuration || {},
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            plan: {
              connect: { id: item.planId }
            }
          }))
        }
      }
    })
    
    // Clear cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    })
    
    return order
  })
  
  return { 
    orderId: order.id 
  }
})