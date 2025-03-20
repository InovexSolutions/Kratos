import { PterodactylService } from '~/server/services/pterodactyl'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const pterodactyl = new PterodactylService()
  return await pterodactyl.createServer(body)
})