import { prisma } from "~/server/lib/prisma"
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    if (!session) throw createError({ statusCode: 403 })
    const isAdmin = prisma.user.findFirst({ where: { id: session.user.id, isAdmin: true } })
    if (!isAdmin) throw createError({ statusCode: 403 })
    const plans = await prisma.pricingPlan.findMany()

    return plans
})