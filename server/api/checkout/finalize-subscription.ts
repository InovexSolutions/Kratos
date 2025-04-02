import { auth } from '~/lib/auth'
import prisma from '~/lib/prisma'
import { stripe } from '~/server/services/stripeService'

// Define types for our order items
interface OrderItem {
    planId: string
    unitPrice: number
    quantity: number
    plan: {
        name: string
    }
}

export default defineEventHandler(async (event) => {
    const { setupIntentId, orderId } = await readBody(event);

    // Fix auth import for server routes
    const session = await auth.api.getSession({
        headers: event.headers
    })

    if (!session?.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    try {
        // Get the order
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                userId: session.user.id
            },
            include: {
                items: {
                    include: { plan: true }
                }
            }
        });

        if (!order) {
            throw createError({ statusCode: 404, message: "Order not found" });
        }

        // Get setup intent
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

        if (setupIntent.status !== 'succeeded') {
            throw createError({ statusCode: 400, message: "Payment setup not complete" });
        }

        // Handle null customer case
        if (!setupIntent.customer) {
            throw createError({
                statusCode: 400,
                message: "No customer associated with this payment method"
            });
        }

        // Ensure we have a string customer ID
        const customerId = typeof setupIntent.customer === 'string'
            ? setupIntent.customer
            : setupIntent.customer.id;

        // First create all price objects and wait for them to complete
        const pricePromises = order.items.map(item =>
            stripe.prices.create({
                currency: 'usd',
                product_data: {
                    name: item.plan.name,
                    metadata: {
                        planId: item.planId
                    }
                },
                unit_amount: Math.round(Number(item.unitPrice) * 100),
                recurring: {
                    interval: 'month'
                }
            })
        );

        const prices = await Promise.all(pricePromises);

        // Create subscription with the provided payment method and resolved price IDs
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: prices.map((price, index) => ({
                price: price.id,
                quantity: order.items[index].quantity
            })),
            default_payment_method: setupIntent.payment_method
                ? (typeof setupIntent.payment_method === 'string'
                    ? setupIntent.payment_method
                    : setupIntent.payment_method.id)
                : undefined,
            metadata: {
                orderId: order.id
            }
        });

        // Step 1: Create a service first since it's required for the subscription
        // This creates a placeholder service that will be updated during provisioning
        const service = await prisma.service.create({
            data: {
                type: order.items[0].plan.serviceType,
                userId: session.user.id,
                status: 'PENDING',
                config: order.items[0].configuration || {}
            }
        });

        // Step 2: Link the service to the order
        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'PENDING',
                serviceId: service.id
            }
        });

        // Step 3: Create the subscription with the new service ID
        await prisma.subscription.create({
            data: {
                stripeSubscriptionId: subscription.id,
                status: 'active',
                currentPeriodStart: new Date(), // Add this required field
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                orderId: order.id,
                userId: session.user.id,
                serviceId: service.id,
            }
        });

        // Return subscription ID for client verification
        return {
            subscriptionId: subscription.id,
            serviceId: service.id,
            status: 'active',
            message: 'Subscription created successfully'
        };
    } catch (error) {
        console.error('Subscription creation error:', error);
        throw createError({
            statusCode: 500,
            message: 'Failed to create subscription: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
    }
});