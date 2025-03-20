export default defineEventHandler((event: { context: { user: { isAdmin: any } } }) => {
    if (!event.context.user?.isAdmin) {
        throw createError({
            status: 403,
            statusText: 'Forbidden - Admin access required'
        })
    }
})