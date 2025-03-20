import { z } from "zod"
import { prisma } from "~/server/lib/prisma"

const planSchema = z.object({
    name: z.string().min(1),
    serviceType: z.enum(['GAME_SERVER', 'VPS', 'DEDICATED_SERVER']),
    priceMonthly: z.number().positive(),
    pricingModel: z.object({
        basePrice: z.number().positive(),
        modifiers: z.array(
            z.object({
                field: z.string().min(1),
                type: z.enum(['per_unit', 'fixed']),
                price: z.number().positive(),
                unit: z.string().optional()
            })
        ).optional()
    }).optional()
})

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    if (!session) throw createError({ statusCode: 403 })
    const isAdmin = prisma.user.findFirst({ where: { id: session.user.id, isAdmin: true } })
    if (!isAdmin) throw createError({ statusCode: 403 })

    const body = await readBody(event)
    const result = planSchema.safeParse(body)
    if (!result.success) {
        throw createError({ statusCode: 400, message: result.error.message })
    }

    const plan = await prisma.pricingPlan.create({
        data: {
            ...result.data,
            configTemplate: result.data.configTemplate || {},
            specs: result.data.specs || {}
        }
    })

    return plan
})  