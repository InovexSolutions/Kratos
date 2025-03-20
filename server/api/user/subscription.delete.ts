import { prisma } from "~/server/lib/prisma"
import { stripe } from "~/server/services/stripeService"
import { getServerSession } from "#auth"

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any)
    if (!session?.user) throw createError({ statusCode: 401 })

    const subscription = await prisma.subscription.findFirst({
        where: { userId: session.user.id }
    })

    if (subscription) {
        // await stripe.cancelStripeSubscription(subscription.stripeSubscriptionId)
        return { success: true }
    }

    throw createError({ statusCode: 404, message: 'No subscription found' })
})
