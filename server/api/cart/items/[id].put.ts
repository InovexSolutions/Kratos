import { z } from "zod"
import { prisma } from "~/server/lib/prisma"
import { getServerSession } from "#auth"

// server/api/cart/items/[id].put.ts
const updateSchema = z.object({
    quantity: z.number().int().min(1)
  })
  
  export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    const user = session?.user
    if (!user) throw createError({ statusCode: 401 })
  
    const { id } = event.context.params || {}
    const body = await readBody(event)
    const result = updateSchema.safeParse(body)
    if (!result.success) {
      throw createError({ statusCode: 400, message: result.error.message })
    }
  
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true }
    })
    
    if (!cart) throw createError({ statusCode: 404, message: 'Cart not found' })
    if (!cart.items.some(item => item.id === id)) {
      throw createError({ statusCode: 404, message: 'Item not in cart' })
    }
  
    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity: result.data.quantity },
      include: { plan: true }
    })
  
    return updatedItem
  })