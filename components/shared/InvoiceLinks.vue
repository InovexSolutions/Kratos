<template>
    <div class="space-y-4">
      <h3 class="text-xl font-bold">Invoice Management</h3>
      
      <a 
        :href="invoiceNinjaClientUrl"
        target="_blank"
        class="block p-4 bg-gray-800 rounded hover:bg-gray-700 transition"
      >
        <Icon name="heroicons:document-chart-bar" class="mr-2" />
        View Invoices on Invoice Ninja
      </a>
  
      <a 
        v-if="authStore.user?.invoiceNinjaId"
        :href="`${invoiceNinjaUrl}/clients/${authStore.user.invoiceNinjaId}`"
        target="_blank"
        class="block p-4 bg-gray-800 rounded hover:bg-gray-700 transition"
      >
        <Icon name="heroicons:user-circle" class="mr-2" />
        Manage Account Details
      </a>
    </div>
  </template>
  
  <script setup>
  const authStore = useAuthStore()
  const config = useRuntimeConfig()
  
  const invoiceNinjaUrl = config.public.invoiceNinjaUrl
  const invoiceNinjaClientUrl = computed(() => 
    `${invoiceNinjaUrl}/clients/${authStore.users?.invoiceNinjaId}`
  )
  </script>