import { PterodactylService } from '~/server/services/pterodactyl'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing server ID' })
  }
  const pterodactyl = new PterodactylService()
  return await pterodactyl.deleteServer(id)
})