import { PterodactylService } from '~/server/services/pterodactyl'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing server ID' })
  }
  
  const body = await readBody(event)
  
  // Ensure all data is properly formatted
  const updateData = {
    // Details update
    name: body.name,
    userId: body.userId, // This matches what our service expects
    description: body.description,
    external_id: body.external_id,
    
    // Limits update
    limits: {
      memory: parseInt(body.limits?.memory),
      swap: parseInt(body.limits?.swap || 0),
      disk: parseInt(body.limits?.disk),
      io: parseInt(body.limits?.io),
      cpu: parseInt(body.limits?.cpu)
    },
    
    // Feature limits
    feature_limits: body.feature_limits || {
      databases: parseInt(body.feature_limits?.databases || 5),
      allocations: parseInt(body.feature_limits?.allocations || 5),
      backups: parseInt(body.feature_limits?.backups || 1)
    },
    
    // Startup config if needed
    eggId: body.eggId ? parseInt(body.eggId) : undefined,
    dockerImage: body.dockerImage,
    startup: body.startup,
    environment: body.environment
  }
  
  const pterodactyl = new PterodactylService()
  return await pterodactyl.updateServer(id, updateData)
})