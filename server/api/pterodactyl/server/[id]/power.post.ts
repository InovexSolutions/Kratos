import prisma from '~/lib/prisma'
import { auth } from "~/lib/auth"
import { PterodactylService } from '~/server/services/pterodactyl.service'

export default defineEventHandler(async (event) => {
    // Authenticate user
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session?.user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    // Get server ID from route params
    const serverId = event.context.params.id
    
    if (!serverId) {
        throw createError({ statusCode: 400, message: 'Server ID is required' })
    }
    
    // Get power action from request body
    const body = await readBody(event)
    const { action } = body
    
    if (!action || !['start', 'stop', 'restart', 'kill'].includes(action)) {
        throw createError({ 
            statusCode: 400, 
            message: 'Valid action is required (start, stop, restart, kill)' 
        })
    }

    try {
        // Get user's Pterodactyl ID
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, pteroUserId: true }
        })

        if (!user || !user.pteroUserId) {
            throw createError({ statusCode: 404, message: 'User not found or not linked to Pterodactyl' })
        }

        // Initialize Pterodactyl service
        const pterodactyl = new PterodactylService()
        
        // Verify that this server belongs to the user
        const userServers = await pterodactyl.getServersFromUser(user.pteroUserId)
        const userServer = userServers.find(server => server.identifier === serverId)
        
        if (!userServer) {
            throw createError({ statusCode: 403, message: 'Server not found or not owned by user' })
        }
        
        // Send the power control action
        await pterodactyl.sendPowerAction(serverId, action)
        
        return { 
            success: true, 
            message: `Server ${action} action sent successfully` 
        }
    } catch (error) {
        console.error('Error controlling server power:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to control server power'
        })
    }
})