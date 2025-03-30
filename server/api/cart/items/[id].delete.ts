import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'

// server/api/cart/items/[id].delete.ts
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  })
  if (!session) throw createError({ statusCode: 401 })

  const user = session.user

  const { id } = event.context.params || {}

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: true }
  })

  if (!cart) throw createError({ statusCode: 404, message: 'Cart not found' })
  if (!cart.items.some(item => item.id === id)) {
    throw createError({ statusCode: 404, message: 'Item not in cart' })
  }

  await prisma.cartItem.delete({ where: { id } })

  return { success: true }
})