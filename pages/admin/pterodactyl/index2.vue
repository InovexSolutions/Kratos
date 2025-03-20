<!-- pages/admin/pterodactyl/index.vue -->
<template>
    <div>
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-white">Pterodactyl Management</h1>
        <button 
          @click="showCreateModal = true"
          class="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg flex items-center"
        >
          🦖 Create New Server
        </button>
      </div>
  
      <!-- Server List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PterodactylServerCard 
          v-for="server in servers"
          :key="server.id"
          :server="server"
          @manage="openServerManagement"
        />
      </div>
  
      <!-- Create Server Modal -->
      <PterodactylCreateModal 
        v-if="showCreateModal"
        @close="showCreateModal = false"
        @created="refreshServers"
      />
    </div>
  </template>
  
  <script setup>
  const { data: servers, refresh: refreshServers } = await useAsyncData(
    'pterodactyl-servers',
    () => $fetch('/api/admin/pterodactyl/servers')
  );
  
  const showCreateModal = ref(false);
  
  const openServerManagement = (serverId) => {
    navigateTo(`/admin/pterodactyl/${serverId}`);
  };
  </script>