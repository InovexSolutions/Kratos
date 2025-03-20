import { PterodactylService } from '~/server/services/pterodactyl'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log(body)
  
  // Prepare data in the correct format for Pterodactyl API
  const pterodactylData = {
    name: body.name,
    node: parseInt(body.nodeId), // This should match the expected field name in your service
    userId: parseInt(body.userId), // This should match the expected field name in your service
    eggId: parseInt(body.eggId),
    description: body.description || '',
    limits: {
      memory: parseInt(body.limits?.memory) || 1024,
      swap: parseInt(body.limits?.swap) || 0,
      disk: parseInt(body.limits?.disk) || 10240,
      io: parseInt(body.limits?.io) || 500,
      cpu: parseInt(body.limits?.cpu) || 100
    },
    feature_limits: body.feature_limits || {
      databases: 5,
      allocations: 5,
      backups: 1
    },
    // Add any other fields needed
  }
  
  const pterodactyl = new PterodactylService()
  return await pterodactyl.createServer(pterodactylData)
})