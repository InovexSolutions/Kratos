import { z } from "zod";
import { prisma } from "~/server/lib/prisma";
import { getServerSession } from "#auth";

const planSchema = z.object({
    priceMonthly: z.number().positive().optional(),
    pricingModel: z.object({
        basePrice: z.number().min(0),
        modifiers: z.array(
            z.object({
                field: z.string(),
                type: z.enum(['per_unit', 'fixed']),
                price: z.number().min(0),
                unit: z.string().optional()
            })
        ).optional()
    }).optional(),
    // ... other editable fields ...
});

export default defineEventHandler(async (event) => {
    const session = await getServerSession(event as any);
    if (!session) throw createError({ statusCode: 403 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      
    if (!user?.isAdmin) throw createError({ statusCode: 403, message: 'Admin access required' });
    
    const { id } = event.context.params ?? {};
    if (!id) throw createError({ statusCode: 400, message: "Invalid plan ID" });
    const body = await readBody(event);

    const result = planSchema.safeParse(body);
    if (!result.success) {
        throw createError({ statusCode: 400, message: result.error.message });
    }

    const updatedPlan = await prisma.pricingPlan.update({
        where: { id },
        data: {
            priceMonthly: result.data.priceMonthly,
            pricingModel: result.data.pricingModel
        }
    });

    return updatedPlan;
});