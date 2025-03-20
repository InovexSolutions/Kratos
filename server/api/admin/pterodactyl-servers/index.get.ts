import { PterodactylService } from '~/server/services/pterodactyl'

export default defineEventHandler(async (event) => {
  const pterodactyl = new PterodactylService()
  return await pterodactyl.getServers()
})