<!-- layouts/admin.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <NavBar class="sticky top-0 z-50" />

    <div class="flex">
      <!-- Admin Sidebar -->
      <aside class="w-64 min-h-screen bg-gray-800/50 border-r border-gray-700/50 p-4">
        <div class="space-y-1">
          <NuxtLink v-for="link in adminLinks" :key="link.path" :to="link.path"
            class="flex items-center p-3 text-gray-300 hover:bg-gray-700/30 rounded-lg transition-colors"
            :class="{ 'bg-blue-500/20 text-blue-400': $route.path === link.path }">
            <span class="mr-2">{{ link.icon }}</span>
            {{ link.name }}
          </NuxtLink>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-8">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup>
const adminLinks = [
  { name: 'Dashboard', path: '/admin', icon: '📊' },
  { name: 'Pterodactyl', path: '/admin/pterodactyl', icon: '🦖' },
  { name: 'Users', path: '/admin/users', icon: '👤' },
  { name: 'Billing', path: '/admin/billing', icon: '💳' },
  { name: 'Data Centers', path: '/admin/management/datacenters', icon: '🏢' },
  { name: 'Hosts', path: '/admin/management/hosts', icon: '🖥️' }
];
</script>