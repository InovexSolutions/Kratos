import { $Enums } from "@prisma/client"
import { JsonValue, Decimal } from "@prisma/client/runtime/library"
import { prisma } from "~/server/lib/prisma"
import { getServerSession } from '#auth'

// server/api/order/index.post.ts
export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    const user = session?.user
    if (!user) throw createError({ statusCode: 401 })
  
    const { cartId } = await readBody(event)
    const cart = await prisma.cart.findUnique({
      where: { id: cartId, userId: user.id },
      include: { items: { include: { plan: true } } }
    })
  
    if (!cart) throw createError({ statusCode: 404, message: 'Cart not found' })
  
    const order = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: user.id,
          status: 'PENDING',
          totalAmount: calculateTotal(cart.items),
          items: {
            create: cart.items.map(item => ({
              plan: { connect: { id: item.planId } },
              configuration: item.configuration as any,
              unitPrice: item.plan.priceMonthly,
              quantity: item.quantity
            }))
          }
        }
      })
  
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      return order
    })
  
    return order
  })

function calculateTotal(items: ({ plan: { name: string; id: string; serviceType: $Enums.ServiceType; configTemplate: JsonValue; priceHourly: Decimal; priceMonthly: Decimal; specs: JsonValue } } & { id: string; createdAt: Date; updatedAt: Date; planId: string; cartId: string; configuration: JsonValue; quantity: number })[]): any {
    throw new Error("Function not implemented.")
}
