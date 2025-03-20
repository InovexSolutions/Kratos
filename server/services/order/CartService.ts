// server/services/order/CartService.ts
import { prisma } from "~/server/lib/prisma"

interface CartItemAddParams {
  userId: string
  planId: string
  configuration: Record<string, any>
  quantity?: number
}

export class CartService {
  async addToCart(params: CartItemAddParams) {
    return prisma.$transaction(async (tx) => {
      // Validate pricing plan
      const plan = await tx.pricingPlan.findUnique({
        where: { id: params.planId },
      });
  
      if (!plan) {
        throw new Error("Pricing plan not found");
      }

      // Create/update cart
      const cart = await tx.cart.upsert({
        where: { userId: params.userId },
        update: {},
        create: { userId: params.userId }
      });

      // Add item to cart
      return tx.cartItem.create({
        data: {
          cartId: cart.id,
          planId: params.planId,
          configuration: params.configuration,
          quantity: params.quantity || 1
        }
      });
    });
  }

  async getCart(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { plan: true }
        }
      }
    });
  }
}