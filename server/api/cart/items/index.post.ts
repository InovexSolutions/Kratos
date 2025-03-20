// server/api/cart/items/index.post.ts
import { z } from 'zod';
import { prisma } from '~/server/lib/prisma';
import { getServerSession } from '#auth'
import { calculateDynamicPrice, PricingModel } from '~/server/utils/priceCalculator';

const itemSchema = z.object({
    planId: z.string().uuid(),
    configuration: z.record(z.any()),
    quantity: z.number().int().positive().default(1)
  })
  
  export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    const user = session?.user
    if (!user) throw createError({ statusCode: 401 })
  
    const body = await readBody(event)
    const result = itemSchema.safeParse(body)
    if (!result.success) {
      throw createError({ statusCode: 400, message: result.error.message })
    }
  
    // Verify plan exists
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: result.data.planId },
      select: {
        priceMonthly: true,
        specs: true,
        configTemplate: true,
        pricingModel: true
      }
    })
    if (!plan) throw createError({ statusCode: 404, message: 'Plan not found' })

    // Validate configuration against template
    const configTemplate = plan.configTemplate as Record<string, any>;
    const configSchema = z.object(
      Object.fromEntries(
        Object.entries(configTemplate).map(([key, spec]) => [
          key,
          spec === 'string' ? z.string() : z.any()
        ])
      )
    );

    const configResult = configSchema.safeParse(result.data.configuration);

    console.info(configResult)

    if (!configResult.success) {
      throw createError({ statusCode: 400, message: 'Invalid configuration' });
    }
  
    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId: user.id }})
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.id }})
    }

    // Calculate dynamic price
    const basePrice = plan.priceMonthly.toNumber();
    const pricingModel = plan.pricingModel as PricingModel | null;
    let unitPrice = basePrice;
    if (pricingModel) {
      unitPrice = calculateDynamicPrice(basePrice, result.data.configuration, pricingModel);
    }
  
    // Add item to cart
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        planId: result.data.planId,
        configuration: result.data.configuration,
        unitPrice: unitPrice,
        quantity: result.data.quantity
      },
      include: { plan: true }
    })
  
    return cartItem
  })