// middleware/auth.js
// export default defineNuxtRouteMiddleware((to) => {
//     const auth = useAuthStore()
//     const publicPaths = [
//         '/',
//         '/auth/login',
//         '/auth/register',
//         
//         '/about',
//         '/contact'
//     ]
// 
//     // Skip auth check for public pages
//     if (publicPaths.includes(to.path)) {
//         return
//     }
// 
//     // Redirect to login if not authenticated
//     if (!auth.isAuthenticated) {
//         return navigateTo(`/auth/login?redirect=${to.path}`)
//     }
// })