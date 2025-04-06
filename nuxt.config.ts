// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  debug: false,

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@prisma/nuxt'
  ],
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    pterodactylApiKey: process.env.NUXT_PTERODACTYL_API_KEY || '',
    pterodactylClientApiKey: process.env.NUXT_PUBLIC_PTERODACTYL_CLIENT_API_KEY || '',
    public: {
      pterodactylUrl: process.env.NUXT_PUBLIC_PTERODACTYL_URL || '',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
    }
  },
  prisma: {
    skipPrompts: true,
    formatSchema: true,
  },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
    '~/components/landing',
  ],
  routeRules: {
    '/dashboard/orders/**': { ssr: false },
    '/auth/**': { ssr: false },
  },
  alias: {
    ".prisma/client/index-browser": `./node_modules/@prisma/client/index-browser.js`,
  },
})