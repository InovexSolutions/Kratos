import { PterodactylService } from '~/server/services/pterodactyl'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing server ID' })
  }
  const body = await readBody(event)
  const pterodactyl = new PterodactylService()
  return await pterodactyl.updateServer(id, body)
})