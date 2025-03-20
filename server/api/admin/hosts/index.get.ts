import { getServerSession } from '#auth'
import { prisma } from '~/server/lib/prisma'

export default defineEventHandler(async (event) => {
  // Check if user is admin
  const session = await getServerSession(event)
  if (!session?.user?.id) throw createError({ statusCode: 401 })
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user?.isAdmin) throw createError({ statusCode: 403, message: 'Admin access required' })

  // Get query params for filtering
  const query = getQuery(event)
  const dataCenterId = query.dataCenterId as string | undefined
  const status = query.status as string | undefined
  const type = query.type as string | undefined

  // Construct filters
  const filters: any = {}
  
  if (dataCenterId) filters.dataCenterId = dataCenterId
  if (status) filters.status = status
  if (type) filters.type = type

  // Get hosts with filtering
  const hosts = await prisma.host.findMany({
    where: filters,
    include: {
      dataCenter: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { hostname: 'asc' }
  })

  return hosts
})