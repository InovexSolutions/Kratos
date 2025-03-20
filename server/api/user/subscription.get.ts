import { getServerSession } from "#auth"
import { prisma } from "~/server/lib/prisma"

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    if (!session?.user) throw createError({ statusCode: 401 })

    return prisma.subscription.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    })
})