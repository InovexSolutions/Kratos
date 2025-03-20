import { prisma } from "~/server/lib/prisma"
import { getServerSession } from '#auth'

// server/api/cart/index.get.ts
export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    if (!session?.user?.id) {
      throw createError({ statusCode: 403, message: 'Unauthorized' })
    }
    const user = session?.user
    
    if (!user) throw createError({ statusCode: 401 })
  
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            plan: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })
  
    if (!cart) {
      return { items: [], total: 0 };
      // throw createError({ statusCode: 404, message: 'Cart not found' });
    }

    return {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice, // Use stored calculated price
        total: Number(item.unitPrice) * item.quantity
      })),
      total: cart.items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0)
    };  
})