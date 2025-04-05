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
    
    // Get command from request body
    const body = await readBody(event)
    const { command } = body
    
    if (!command) {
        throw createError({ statusCode: 400, message: 'Command is required' })
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
        
        // Send the command
        await pterodactyl.sendServerCommand(serverId, command)
        
        return { success: true, message: 'Command sent successfully' }
    } catch (error) {
        console.error('Error sending command:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to send command'
        })
    }
})