// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
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
    public: {
      invoiceNinjaKey: process.env.NUXT_PUBLIC_INVOICE_NINJA_TOKEN,
      pterodactylUrl: process.env.NUXT_PUBLIC_PTERODACTYL_URL || '',
      pterodactylClientApiKey: process.env.NUXT_PUBLIC_PTERODACTYL_API_KEY || '',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
    }
  },

  prisma: {
    skipPrompts: true,
    formatSchema: true,
  },
})