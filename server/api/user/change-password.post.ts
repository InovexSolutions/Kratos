// ~/server/api/user/change-password.post.ts
import { prisma } from "~/server/lib/prisma"
import { getServerSession } from '#auth'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const session = await getServerSession(event as any)
  
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user?.passwordHash) {
    throw createError({ statusCode: 400, message: 'Password not set for this account' })
  }

  const valid = await bcrypt.compare(body.currentPassword, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 400, message: 'Current password is incorrect' })
  }

  const hashedPassword = await bcrypt.hash(body.newPassword, 10)
  
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hashedPassword }
  })

  return { success: true }
})