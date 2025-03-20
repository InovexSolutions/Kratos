import { prisma } from "~/server/lib/prisma"
import { getServerSession } from '#auth'

// server/api/order/index.get.ts
export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    if (!session?.user?.id) {
      throw createError({ statusCode: 403, message: 'Unauthorized' })
    }
    const user = session?.user
    
    if (!user) throw createError({ statusCode: 401 })
  
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
        include: { items: { include: { plan: true } } }
    })

    return orders
})