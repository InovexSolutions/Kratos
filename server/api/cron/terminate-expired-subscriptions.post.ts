import prisma from '~/lib/prisma'
import { PterodactylService } from '~/server/services/pterodactyl.service'

export default defineEventHandler(async (event) => {
    // Secure endpoint with API key authentication
    const authHeader = getHeader(event, 'authorization')
    const expectedToken = process.env.CRON_SECRET

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    try {
        const now = new Date()

        // Find expired subscriptions with terminate flag
        const expiredSubscriptions = await prisma.subscription.findMany({
            where: {
                cancelAtPeriodEnd: true,
                currentPeriodEnd: {
                    lt: now // Less than current time (expired)
                }
            },
            include: {
                order: {
                    where: {
                        terminateAtPeriodEnd: true
                    },
                    include: {
                        service: {
                            include: {
                                pterodactyl: true
                            }
                        }
                    }
                }
            }
        })

        console.log(`Found ${expiredSubscriptions.length} expired subscriptions to terminate`)

        const pterodactylService = new PterodactylService()
        const results = {
            success: [] as string[],
            failed: [] as string[]
        }

        // Process each expired subscription
        for (const subscription of expiredSubscriptions) {
            if (!subscription.order) continue

            const { order } = subscription
            const { service } = order

            try {
                if (service?.pterodactyl?.pteroId) {
                    // Delete the server in Pterodactyl
                    await pterodactylService.deleteServer(service.pterodactyl.pteroId)

                    // Update service status
                    await prisma.service.update({
                        where: { id: service.id },
                        data: {
                            status: 'CANCELLED',
                            terminationDate: now
                        }
                    })

                    // Send notification to Discord webhook
                    await sendDiscordWebhook({
                        content: `🗑️ Server terminated automatically: Order #${order.id} - Subscription ended and termination was requested.`
                    })

                    results.success.push(order.id)
                }
            } catch (error) {
                console.error(`Failed to terminate server for order ${order.id}:`, error)
                results.failed.push(order.id)

                // Send notification about failed termination
                await sendDiscordWebhook({
                    content: `⚠️ **TERMINATION FAILED**: Order #${order.id} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }
        }

        return {
            success: true,
            terminated: results.success.length,
            failed: results.failed.length,
            results
        }
    } catch (error) {
        console.error('Error in terminate-expired-subscriptions cron:', error)

        // Send notification about cron job failure
        await sendDiscordWebhook({
            content: `🚨 **TERMINATION CRON JOB FAILED**: ${error instanceof Error ? error.message : 'Unknown error'}`
        })

        throw createError({
            statusCode: 500,
            message: 'Failed to process expired subscriptions'
        })
    }
})

// Helper function to send Discord webhook
async function sendDiscordWebhook(payload: { content: string }) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL

    if (!webhookUrl) {
        console.warn('Discord webhook URL not configured')
        return
    }

    try {
        await $fetch(webhookUrl, {
            method: 'POST',
            body: payload,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    } catch (error) {
        console.error('Failed to send Discord webhook:', error)
    }
}