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
        
        // First, verify that this server belongs to the user
        const userServers = await pterodactyl.getServersFromUser(user.pteroUserId)
        const userServer = userServers.find(server => server.identifier === serverId)
        
        if (!userServer) {
            throw createError({ statusCode: 403, message: 'Server not found or not owned by user' })
        }
        
        // Fetch detailed server information
        const serverDetails = await pterodactyl.getServerDetails(serverId)
        
        // Get additional server utilization information and status
        let utilization = { cpu: 0, memory: 0, disk: 0, uptime: 0 }
        let serverStatus = serverDetails.status || 'offline'

        try {
            const resourceData = await pterodactyl.getServerUtilization(serverId)
            utilization = {
                cpu: resourceData.cpu,
                memory: resourceData.memory,
                disk: resourceData.disk,
                uptime: resourceData.uptime
            }
            // Use the status from the resources endpoint if available
            if (resourceData.status) {
                serverStatus = resourceData.status
            }
        } catch (error) {
            console.warn(`Failed to get utilization for server ${serverId}:`, error)
        }
        
        // Extract egg name for better display
        const eggName = serverDetails.name.includes('-') 
            ? serverDetails.name.split('-')[0].trim() 
            : 'Game Server'
        
        return {
            ...serverDetails,
            egg_name: eggName,
            utilization,
            status: serverStatus,
            limits: {
                cpu: serverDetails.limits?.cpu || 100,  // Default to 1 core
                memory: serverDetails.limits?.memory || 1024, // Default to 1 GB in MB
                disk: serverDetails.limits?.disk || 10240,  // Default to 10 GB in MB
                io: serverDetails.limits?.io,
                swap: serverDetails.limits?.swap
            }
        }
    } catch (error) {
        console.error('Error fetching server details:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to get server details'
        })
    }
})