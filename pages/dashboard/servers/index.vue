<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
    <NavBar class="sticky top-0 z-50" />

    <div class="container mx-auto px-4 py-12">
      <!-- Header Section -->
      <div class="mb-12 text-center animate-fade-in-up">
        <h1 class="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Game Servers
        </h1>
        <p class="text-xl text-gray-300">Manage your active game servers</p>

        <!-- Stats Cards -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-in-right">
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-3xl font-bold text-green-400 mb-2">{{ activeServers }}</div>
            <div class="text-gray-400">Online Servers</div>
          </div>
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-3xl font-bold text-blue-400 mb-2">{{ totalCpu.toFixed(2) }}%</div>
            <div class="text-gray-400">Avg. CPU Usage</div>
          </div>
          <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
            <div class="text-3xl font-bold text-purple-400 mb-2">{{ totalRam }} GB</div>
            <div class="text-gray-400">Total RAM</div>
          </div>
        </div>
      </div>

      <!-- Server Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-if="loading" class="col-span-3 flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"/>
        </div>

        <div v-else-if="error" class="col-span-3 text-center py-12">
          <div class="text-red-400 text-xl mb-4">Failed to load servers</div>
          <p class="text-gray-400 mb-6">{{ error }}</p>
          <button class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" @click="fetchServers">
            Try Again
          </button>
        </div>

        <div v-else-if="!servers || servers.length === 0" class="col-span-3 text-center py-12 animate-fade-in-up">
          <div class="text-2xl text-gray-400 mb-4">No servers found</div>
          <NuxtLink
to="/games" 
             class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2">
            <Icon name="heroicons:plus-20-solid" class="w-5 h-5" />
            Create New Server
          </NuxtLink>
        </div>

        <div
v-for="(server, index) in servers" :key="server.id"
          class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 group animate-fade-in-up"
          :style="`animation-delay: ${index * 50}ms`">
          
          <!-- Server Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-100">{{ server.name }}</h3>
            <span
class="flex items-center text-sm"
              :class="server.status === 'running' ? 'text-green-400' : 'text-red-400'">
              <span
class="w-2 h-2 rounded-full mr-2"
                :class="server.status === 'running' ? 'bg-green-400' : 'bg-red-400'"/>
              {{ server.status === 'running' ? 'Online' : 'Offline' }}
            </span>
          </div>

          <!-- Server Details -->
          <div class="flex items-center mb-6">
            <NuxtImg :src="getGameImage(server)" class="w-12 h-12 rounded-lg mr-4" loading="lazy" />
            <div>
              <p class="text-gray-400 text-sm">{{ server.egg_name || 'Game Server' }}</p>
              <p class="text-gray-300 font-mono text-sm">{{ getServerAddress(server) }}</p>
            </div>
          </div>

          <!-- Server Controls -->
          <div class="grid grid-cols-3 gap-2 mb-6">
            <button
class="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                    @click="openConsole(server)">
              <Icon name="heroicons:command-line" class="text-lg" />
            </button>
            <button
:class="[
                    'p-2 rounded-lg transition-colors',
                    server.status === 'running' 
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                  ]"
                  @click="toggleServerPower(server)">
              <Icon :name="server.status === 'running' ? 'heroicons:stop' : 'heroicons:play'" class="text-lg" />
            </button>
            <button
                class="p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-colors"
                @click="restartServer(server)">
              <Icon name="heroicons:arrow-path" class="text-lg" />
            </button>
          </div>

          <!-- Server Stats -->
          <div class="pt-4 border-t border-gray-700/50">
            <div class="mb-2">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-400">CPU</span>
                <span class="text-gray-100">
                  {{ server.utilization?.cpu?.toFixed(2) || 0 }}% / {{ server.limits?.cpu || 100 }}%
                  <span v-if="(server.utilization?.cpu || 0) > 100" class="text-xs text-gray-500">
                    ({{ Math.floor((server.utilization?.cpu || 0) / 100) }} cores)
                  </span>
                </span>
              </div>
              <div class="w-full bg-gray-700/50 rounded-full h-1.5">
                <div
                  class="bg-blue-500 h-1.5 rounded-full" 
                  :style="`width: ${Math.min((server.utilization?.cpu || 0), 100)}%`"></div>
              </div>
            </div>
            
            <div class="mb-2">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-400">Memory</span>
                <span class="text-gray-100">{{ formatMemory(server.utilization?.memory) }} / {{ formatMemory(server.limits?.memory) }}</span>
              </div>
              <div class="w-full bg-gray-700/50 rounded-full h-1.5">
                <div
                  class="bg-purple-500 h-1.5 rounded-full" 
                  :style="`width: ${calculateMemoryPercentage(server.utilization?.memory, server.limits?.memory)}%`"></div>
              </div>
            </div>
            
            <div class="mb-2">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-400">Disk</span>
                <span class="text-gray-100">{{ formatMemory(server.utilization?.disk) }} / {{ formatMemory(server.limits?.disk) }}</span>
              </div>
              <div class="w-full bg-gray-700/50 rounded-full h-1.5">
                <div
                  class="bg-green-500 h-1.5 rounded-full" 
                  :style="`width: ${calculateMemoryPercentage(server.utilization?.disk, server.limits?.disk)}%`"></div>
              </div>
            </div>
          </div>
          
          <!-- Server Actions Footer -->
          <div class="mt-4 flex justify-end">
            <NuxtLink
:to="`/dashboard/servers/${server.identifier}`" 
                     class="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm">
              Manage <Icon name="heroicons:arrow-right" class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>
      </div>
      
      <!-- Control Panel Link -->
      <div class="mt-12 text-center animate-fade-in-up">
        <a href="/pterodactyl" target="_blank" class="text-blue-400 hover:text-blue-300 flex items-center gap-2 justify-center">
          <span>Open Full Control Panel</span>
          <Icon name="heroicons:arrow-top-right-on-square" class="w-4 h-4" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  auth: true
});

const servers = ref([]);
const loading = ref(true);
const error = ref(null);
const activeServers = ref(0);
const totalCpu = ref(0);
const totalRam = ref(0);
const toast = useToast();

// Fetch servers
const fetchServers = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await $fetch('/api/pterodactyl/user_servers');
    console.log('Fetched servers:', response);
    
    // Process servers data
    servers.value = response.map(server => ({
      ...server,
      status: server.status || 'offline',
      utilization: server.utilization || {
        cpu: 0,
        memory: 0,
        disk: 0,
      },
      limits: server.limits || {
        cpu: 100, // Default 1 core
        memory: 1024, // Default 1GB in MB
        disk: 10240 // Default 10GB in MB
      }
    }));
    console.log('Processed servers:', servers.value);
    
    // Calculate stats
    activeServers.value = servers.value.filter(s => s.status === 'running').length;
    
    // Calculate average CPU usage for active servers
    if (activeServers.value > 0) {
      const activeCpu = servers.value
        .filter(s => s.status === 'running')
        .reduce((sum, server) => sum + (server.utilization?.cpu || 0), 0);
      totalCpu.value = Math.round(activeCpu / activeServers.value);
    }
    
    // Calculate total RAM allocated (convert from MB to GB)
    totalRam.value = servers.value.reduce((sum, server) => {
      return sum + (server.limits?.memory ? server.limits.memory / 1024 : 0);
    }, 0).toFixed(1);
    
  } catch (err) {
    console.error('Error fetching Pterodactyl servers:', err);
    error.value = err.message || 'Failed to load servers';
  } finally {
    loading.value = false;
  }
};

// Format memory values (MB to human-readable)
const formatMemory = (memoryMb) => {
  if (!memoryMb) return '0 MB';
  
  if (memoryMb >= 1024) { // 1 GB in MB
    return `${(memoryMb / 1024).toFixed(2)} GB`;
  } else {
    return `${Math.round(memoryMb)} MB`;
  }
};

// Calculate memory usage percentage
const calculateMemoryPercentage = (used, total) => {
  if (!used || !total) return 0;
  const percentage = (used / total) * 100;
  return Math.min(percentage, 100); // Cap at 100%
};

// Get server address (IP:port)
const getServerAddress = (server) => {
  if (!server.allocation) return 'No address';
  return `${server.allocation.ip}:${server.allocation.port}`;
};

// Get appropriate game image
const getGameImage = (server) => {
  // Map known egg names to game images
  const gameImages = {
    'minecraft': '/images/games/minecraft.png',
    'rust': '/images/games/rust.png',
    'valheim': '/images/games/valheim.png',
    'factorio': '/images/games/factorio.png',
    'ark': '/images/games/ark.png',
    'csgo': '/images/games/csgo.png'
  };
  
  // Try to match by egg name or description
  const serverType = server.egg_name?.toLowerCase() || '';
  
  for (const [game, image] of Object.entries(gameImages)) {
    if (serverType.includes(game)) {
      return image;
    }
  }
  
  // Default image if no match
  return '/images/games/minecraft.png';
};

// Server control functions
const openConsole = (server) => {
  // Open the server console (could redirect to Pterodactyl or open in a modal)
  window.open(`/pterodactyl/server/${server.identifier}/console`, '_blank');
};

const toggleServerPower = async (server) => {
  try {
    const action = server.status === 'running' ? 'stop' : 'start';
    
    // Show toast notification
    toast.add({
      title: `${action === 'start' ? 'Starting' : 'Stopping'} Server`,
      description: `${action === 'start' ? 'Starting' : 'Stopping'} ${server.name}...`,
      color: 'info',
      icon: 'i-heroicons-information-circle'
    });
    
    // Call API
    await $fetch(`/api/pterodactyl/server/${server.identifier}/power`, {
      method: 'POST',
      body: { action }
    });
    
    // Update server status locally for immediate feedback
    const serverIndex = servers.value.findIndex(s => s.identifier === server.identifier);
    if (serverIndex !== -1) {
      servers.value[serverIndex].status = action === 'start' ? 'running' : 'stopped';
    }
    
    // Refresh servers after a delay to get updated status
    setTimeout(fetchServers, 3000);
    
    // Show success toast
    toast.add({
      title: `Server ${action === 'start' ? 'Started' : 'Stopped'}`,
      description: `${server.name} has been ${action === 'start' ? 'started' : 'stopped'} successfully`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
  } catch (error) {
    console.error(`Failed to ${server.status === 'running' ? 'stop' : 'start'} server:`, error);
    
    // Show error toast
    toast.add({
      title: 'Action Failed',
      description: `Failed to ${server.status === 'running' ? 'stop' : 'start'} the server. Please try again.`,
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
  }
};

const restartServer = async (server) => {
  try {
    // Show toast notification
    toast.add({
      title: 'Restarting Server',
      description: `Restarting ${server.name}...`,
      color: 'info',
      icon: 'i-heroicons-arrow-path'
    });
    
    // Call API
    await $fetch(`/api/pterodactyl/server/${server.identifier}/power`, {
      method: 'POST',
      body: { action: 'restart' }
    });
    
    // Refresh servers after a delay to get updated status
    setTimeout(fetchServers, 5000);
    
    // Show success toast
    toast.add({
      title: 'Server Restarted',
      description: `${server.name} has been restarted successfully`,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    });
  } catch (error) {
    console.error('Failed to restart server:', error);
    
    // Show error toast
    toast.add({
      title: 'Restart Failed',
      description: 'Failed to restart the server. Please try again.',
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    });
  }
};

// Initialize data
onMounted(fetchServers);

// Set up polling to refresh server status
let refreshInterval;
onMounted(() => {
  refreshInterval = setInterval(fetchServers, 60000); // Refresh every minute
});

onBeforeUnmount(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>