// plugins/pterodactyl.client.ts
import ptero from "pterodactyl-api-wrapper";

export default defineNuxtPlugin((nuxtApp) => {
  console.log("process.env", process.env.NUXT_PUBLIC_PTERODACTYL_URL);
  const config = useRuntimeConfig()

  if (config.public.pterodactylUrl) {
    ptero.Setup.setPanel(config.public.pterodactylUrl);
  } else {
    throw new Error("pterodactylUrl is not defined");
  }
});