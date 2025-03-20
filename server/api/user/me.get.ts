// server/api/user/me.get.ts
export default defineEventHandler((event) => {
    console.log('event:', event)
    const user = event.context.user
    if (!user) throw createError({ statusCode: 401 })
    return user
})