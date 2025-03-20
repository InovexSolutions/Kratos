import { prisma } from "~/server/lib/prisma"

// server/api/services/index.get.ts
export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401 })

    const services = await prisma.service.findMany({
        where: { userId: user.id },
        include: { host: true, network: true }
    })

    // return services.map(service => ({
    //     ...service,
    //     config: parseServiceConfig(service.type, service.config)
    // }))
})