<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <NavBar class="sticky top-0 z-50" />

    <div class="container mx-auto px-4 py-12">
      <!-- Dashboard Header -->
      <div class="mb-12 text-center animate-fade-in-up">
        <h1 class="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Server Dashboard
        </h1>
        <p class="text-xl text-gray-300">Manage your active game servers</p>

        <!-- Stats Cards -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-in-right">
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-3xl font-bold text-green-400 mb-2">{{ activeServers }}</div>
            <div class="text-gray-400">Active Servers</div>
          </div>
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-3xl font-bold text-blue-400 mb-2">{{ cpuUsage }}%</div>
            <div class="text-gray-400">CPU Usage</div>
          </div>
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-3xl font-bold text-purple-400 mb-2">99.9%</div>
            <div class="text-gray-400">Uptime</div>
          </div>
        </div>
      </div>

      <div>
        <SubscriptionStatus />
        <!-- <InvoiceLinks /> -->
        <!-- <CheckoutButton :price-id="selectedPriceId" :config="serverConfig" /> -->
      </div>

      <!-- Server Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(server, index) in servers" :key="server.id"
          class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 group animate-fade-in-up"
          :style="`animation-delay: ${index * 50}ms`">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-100">{{ server.name }}</h3>
            <span class="flex items-center text-sm"
              :class="server.status === 'online' ? 'text-green-400' : 'text-red-400'">
              <span class="w-2 h-2 rounded-full mr-2"
                :class="server.status === 'online' ? 'bg-green-400' : 'bg-red-400'"></span>
              {{ server.status }}
            </span>
          </div>

          <div class="flex items-center mb-6">
            <NuxtImg :src="`/${server.image}`" provider="ipx" class="w-12 h-12 rounded-lg mr-4" loading="lazy" />
            <div>
              <p class="text-gray-400 text-sm">{{ server.game }}</p>
              <p class="text-gray-300 font-mono text-sm">{{ server.ip }}</p>
            </div>
          </div>

          <ServerControls :server="server" />

          <div class="mt-6 pt-4 border-t border-gray-700/50">
            <div class="flex justify-between text-sm">
              <div class="text-gray-400">Players</div>
              <div class="text-gray-100">{{ server.players }}/{{ server.maxPlayers }}</div>
            </div>
            <div class="flex justify-between text-sm">
              <div class="text-gray-400">Uptime</div>
              <div class="text-gray-100">{{ server.uptime }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create an orders redirect with the same style as others -->
      <NuxtLink to="/dashboard/orders">
        <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 animate-fade-in-up">
          <div class="text-3xl font-bold text-blue-400 mb-2">Orders</div>
            <div class="text-gray-400">Manage your active orders</div>
            <div class="text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-end">
              View <span class="ml-2">→</span>
            </div>
        </div>
      </NuxtLink>

      <!-- Create Server Button -->
      <div class="mt-12 text-center animate-fade-in-up delay-300">
        <button @click="showCreateServerModal = true"
          class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/20">
          <span class="mr-2">🎮</span> Create New Server
        </button>
      </div>
    </div>

    <!-- Create Server Modal -->
    <CreateServerModal v-if="showCreateServerModal" @close="showCreateServerModal = false" />
  </div>
</template>

<script setup>
const { $api } = useNuxtApp();
const authStore = useAuthStore();

const servers = ref([]);
const showCreateServerModal = ref(false);
const activeServers = ref(0);
const cpuUsage = ref(15);

// Sample data - replace with your API call
onMounted(async () => {
  const userServers = await $fetch('/api/pterodactyl/user_servers', {
    headers: {
      Authorization: `Bearer ${authStore.token}`
    }
  });
  // Format some data
  servers.value = userServers.map(server => ({
    id: server.id,
    name: server.name,
    game: 'WIP',
    image: '/images/games/minecraft.png',
    status: 'online',
    ip: server.allocation.ip + ':' + server.allocation.port,
    players: '∞', // Infinite symbol is '∞'
    maxPlayers: '∞',
    uptime: '∞'
  }));
  // const response = await $api.getUserServers(authStore.user.id);
  // servers.value = [
  //   {
  //     id: 1,
  //     name: 'Valhalla Clan',
  //     game: 'valheim',
  //     image: '/games/valheim.png',
  //     status: 'online',
  //     ip: '192.168.1.1:2456',
  //     players: 8,
  //     maxPlayers: 10,
  //     uptime: '12d 4h'
  //   },
  //   {
  //     id: 2,
  //     name: 'Rust Arena',
  //     game: 'rust',
  //     image: '/games/rust.jpg',
  //     status: 'offline',
  //     ip: '192.168.1.1:28015',
  //     players: 0,
  //     maxPlayers: 50,
  //     uptime: '2d 18h'
  //   }
  // ];
  activeServers.value = servers.value.filter(s => s.status === 'online').length;
});
</script>

<style>
/* Reuse animations from previous components */
.dashboard-container {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.server-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.1);
}
</style>