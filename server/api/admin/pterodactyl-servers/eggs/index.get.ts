import { PterodactylService } from '~/server/services/pterodactyl'

export default defineEventHandler(async (event) => {
  // Get query params
  const query = getQuery(event)
  const nestId = query.nestId as string | undefined
  const pterodactyl = new PterodactylService()
  return await pterodactyl.getEggs(nestId)  
})