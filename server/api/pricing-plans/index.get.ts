import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'


export default defineEventHandler(async () => {
    const plans = await prisma.pricingPlan.findMany()

    return plans
})