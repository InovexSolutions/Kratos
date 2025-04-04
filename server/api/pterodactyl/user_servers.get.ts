import prisma from '~/lib/prisma'
import { auth } from "~/lib/auth";
import { PterodactylService } from '~/server/services/pterodactyl.service'

export default defineEventHandler(async (event) => {
    // Get authenticated user
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session?.user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, pteroUserId: true }
    })

    if (!user) {
        throw createError({ statusCode: 404, message: 'User not found' })
    }

    // If user has no pterodactyl_user_id, they don't have any servers yet
    if (!user.pteroUserId) {
        return []
    }

    // Get servers from Pterodactyl
    try {
        const pterodactyl = new PterodactylService()
        const servers = await pterodactyl.getServersFromUser(user.pteroUserId)
        console.log('[Pterodactyl] User servers:', servers)
        
        // Enhanced server data with proper error handling
        const enhancedServers = await Promise.all(servers.map(async (server) => {
            try {
                // Get basic server details to get allocation data
                const details = await pterodactyl.getServerDetails(server.id)
                console.log('Server details:', details)
                
                // Get server utilization (resources)
                let utilization = { 
                    cpu: 0, 
                    memory: 0,  // In MB 
                    disk: 0,    // In MB
                    uptime: 0 
                }
                
                // Set a default status if null
                let status = server.status || 'offline'

                try {
                    utilization = await pterodactyl.getServerUtilization(server.identifier);
                    
                    // Use the status from the resources endpoint
                    if (utilization.status) {
                        status = utilization.status;
                    }
                    
                    // Convert bytes to MB if needed
                    if (utilization.memory > 1048576) { // If memory is in bytes
                        utilization.memory = utilization.memory / 1048576; // Convert to MB
                    }
                    if (utilization.disk > 1048576) { // If disk is in bytes
                        utilization.disk = utilization.disk / 1048576; // Convert to MB
                    }
                } catch (err) {
                    console.warn(`Failed to get utilization for server ${server.identifier}:`, err);
                }
                
                // Make sure limits are in the right format
                const limits = {
                    cpu: details.limits?.cpu || 100, // 100 = 1 core
                    memory: details.limits?.memory || 1024, // MB
                    disk: details.limits?.disk || 10240 // MB
                }
                
                return {
                    ...server,
                    ...details,
                    status,
                    utilization,
                    limits
                }
            } catch (err) {
                console.error(`Error enhancing server ${server.identifier}:`, err)
                return {
                    ...server,
                    status: server.status || 'offline',
                    utilization: { cpu: 0, memory: 0, disk: 0, uptime: 0 },
                    limits: {
                        cpu: 100,
                        memory: 1024,
                        disk: 10240
                    }
                }
            }
        }))
        
        console.log('Enhanced servers:', enhancedServers)
        return enhancedServers
    } catch (error) {
        console.error('Error fetching pterodactyl servers:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to get servers from Pterodactyl'
        })
    }
})