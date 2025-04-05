<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <NavBar class="sticky top-0 z-50" />
  
      <div v-if="loading" class="container mx-auto px-4 py-12 flex justify-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"/>
      </div>
  
      <div v-else-if="error" class="container mx-auto px-4 py-12 text-center">
        <div class="text-red-400 text-2xl mb-4">Failed to load server details</div>
        <p class="text-gray-400 mb-6">{{ error }}</p>
        <NuxtLink to="/dashboard/servers" class="px-6 py-3 bg-blue-600 text-white rounded-lg">
          Return to Servers
        </NuxtLink>
      </div>
  
      <div v-else class="container mx-auto px-4 py-12 max-w-7xl">
        <!-- Server Header -->
        <div class="mb-8 animate-fade-in-up">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                {{ server.name }}
              </h1>
              <p class="text-gray-300 mt-2">{{ server.egg_name || 'Game Server' }}</p>
            </div>
            <span
              class="px-4 py-2 rounded-full text-sm" 
              :class="server.status === 'running' ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'">
              {{ server.status === 'running' ? 'Online' : 'Offline' }}
            </span>
          </div>
  
          <!-- Quick Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
              <div class="text-gray-400 text-sm mb-1">Server Address</div>
              <div class="text-xl font-bold text-blue-400 font-mono">
                {{ getServerAddress(server) }}
              </div>
            </div>
            
            <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
              <div class="text-gray-400 text-sm mb-1">CPU Usage</div>
              <div class="text-xl font-bold text-green-400">
                {{ server.utilization?.cpu?.toFixed(2) || 0 }}% / {{ server.limits?.cpu || 100 }}%
              </div>
            </div>
  
            <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
              <div class="text-gray-400 text-sm mb-1">Memory</div>
              <div class="text-xl font-bold text-yellow-400">
                {{ formatMemory(server.utilization?.memory) }} / {{ formatMemory(server.limits?.memory) }}
              </div>
            </div>
  
            <div class="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
              <div class="text-gray-400 text-sm mb-1">Disk Space</div>
              <div class="text-xl font-bold text-purple-400">
                {{ formatMemory(server.utilization?.disk) }} / {{ formatMemory(server.limits?.disk) }}
              </div>
            </div>
          </div>
        </div>
  
        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Server Controls -->
            <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
              <h2 class="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                <Icon name="heroicons:command-line" class="text-blue-400" />
                Server Controls
              </h2>
              
              <div class="grid grid-cols-2 gap-4 text-gray-400">
                <button
                  class="control-btn bg-green-500/20 hover:bg-green-500/30"
                  @click="restartServer">
                  <Icon name="heroicons:arrow-path" class="text-green-400" />
                  Restart Server
                </button>
                <button
                  class="control-btn"
                  :class="server.status === 'running' ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-green-500/20 hover:bg-green-500/30'"
                  @click="togglePower">
                  <Icon 
                    :name="server.status === 'running' ? 'heroicons:stop' : 'heroicons:play'" 
                    :class="server.status === 'running' ? 'text-red-400' : 'text-green-400'" />
                  {{ server.status === 'running' ? 'Stop Server' : 'Start Server' }}
                </button>
                <button
                  class="control-btn bg-blue-500/20 hover:bg-blue-500/30"
                  @click="openFileManager">
                  <Icon name="heroicons:folder" class="text-blue-400" />
                  File Manager
                </button>
                <button
                  class="control-btn bg-purple-500/20 hover:bg-purple-500/30"
                  @click="openBackupManager">
                  <Icon name="heroicons:server-stack" class="text-purple-400" />
                  Backups
                </button>
              </div>
            </div>
  
            <!-- Console Component -->
            <ServerConsole :server-id="serverId" />
          </div>
  
          <!-- Right Column - Server Information -->
          <div class="space-y-6">
            <!-- Server Details -->
            <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
              <h2 class="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                <Icon name="heroicons:server" class="text-yellow-400" />
                Server Details
              </h2>
  
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <span class="text-gray-400">Server ID</span>
                  <span class="text-gray-100 font-mono">{{ server.identifier }}</span>
                </div>
  
                <div class="flex justify-between items-center">
                  <span class="text-gray-400">Node</span>
                  <span class="text-gray-100">{{ server.node || 'Default Node' }}</span>
                </div>
  
                <div class="flex justify-between items-center">
                  <span class="text-gray-400">Server Type</span>
                  <span class="text-gray-100">{{ server.egg_name || 'Game Server' }}</span>
                </div>
  
                <div class="flex justify-between items-center">
                  <span class="text-gray-400">Nest</span>
                  <span class="text-gray-100">{{ server.nest_name || 'Default Nest' }}</span>
                </div>
              </div>
            </div>
  
            <!-- Resource Usage -->
            <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
              <h2 class="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                <Icon name="heroicons:chart-bar" class="text-blue-400" />
                Resource Usage
              </h2>
  
              <div class="space-y-6">
                <!-- CPU Usage -->
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-gray-400">CPU Usage</span>
                    <span class="text-gray-100">{{ server.utilization?.cpu?.toFixed(2) || 0 }}% / {{ server.limits?.cpu || 100 }}%</span>
                  </div>
                  <div class="w-full bg-gray-700/50 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" 
                         :style="`width: ${Math.min((server.utilization?.cpu || 0), 100)}%`"></div>
                  </div>
                  <div v-if="(server.utilization?.cpu || 0) > 100" class="text-xs text-gray-500 mt-1">
                    Using multiple cores ({{ Math.floor((server.utilization?.cpu || 0) / 100) }} cores)
                  </div>
                </div>
  
                <!-- Memory Usage -->
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-gray-400">Memory Usage</span>
                    <span class="text-gray-100">{{ formatMemory(server.utilization?.memory) }}</span>
                  </div>
                  <div class="w-full bg-gray-700/50 rounded-full h-2">
                    <div class="bg-purple-500 h-2 rounded-full" 
                         :style="`width: ${calculateMemoryPercentage(server.utilization?.memory, server.limits?.memory)}%`"></div>
                  </div>
                  <div class="text-xs text-gray-500 mt-1 text-right">
                    Limit: {{ formatMemory(server.limits?.memory) }}
                  </div>
                </div>
  
                <!-- Disk Usage -->
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-gray-400">Disk Usage</span>
                    <span class="text-gray-100">{{ formatMemory(server.utilization?.disk) }}</span>
                  </div>
                  <div class="w-full bg-gray-700/50 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" 
                         :style="`width: ${calculateMemoryPercentage(server.utilization?.disk, server.limits?.disk)}%`"></div>
                  </div>
                  <div class="text-xs text-gray-500 mt-1 text-right">
                    Limit: {{ formatMemory(server.limits?.disk) }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- External Links -->
            <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
              <h2 class="text-xl font-bold text-gray-100 mb-4">External Access</h2>
              
              <div class="space-y-4">
                <a 
                  :href="`/pterodactyl/server/${server.identifier}`" 
                  target="_blank"
                  class="flex items-center justify-between w-full p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors">
                  <span class="flex items-center">
                    <Icon name="heroicons:server" class="mr-2" />
                    Pterodactyl Panel
                  </span>
                  <Icon name="heroicons:arrow-top-right-on-square" />
                </a>
                
                <a 
                  :href="`/pterodactyl/server/${server.identifier}/files`" 
                  target="_blank"
                  class="flex items-center justify-between w-full p-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors">
                  <span class="flex items-center">
                    <Icon name="heroicons:folder" class="mr-2" />
                    File Manager
                  </span>
                  <Icon name="heroicons:arrow-top-right-on-square" />
                </a>
                
                <a 
                  :href="`/pterodactyl/server/${server.identifier}/backups`" 
                  target="_blank"
                  class="flex items-center justify-between w-full p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors">
                  <span class="flex items-center">
                    <Icon name="heroicons:server-stack" class="mr-2" />
                    Backup Manager
                  </span>
                  <Icon name="heroicons:arrow-top-right-on-square" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>

  definePageMeta({
    auth: true
  });
  
  const route = useRoute();
  const serverId = route.params.id;
  
  const server = ref({});
  const loading = ref(true);
  const error = ref(null);
  const toast = useToast(); // Replace $toast with useToast()
  
  // Fetch server details
  const fetchServer = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await $fetch(`/api/pterodactyl/server/${serverId}`);
      server.value = {
        ...response,
        utilization: response.utilization || {
          cpu: 0,
          memory: 0,
          disk: 0,
        },
        limits: response.limits || {
          memory: 1024,
          disk: 10240
        },
        status: response.status || 'offline' // Make sure status is properly set
      };
    } catch (err) {
      console.error('Error fetching server details:', err);
      error.value = err.message || 'Failed to load server details';
    } finally {
      loading.value = false;
    }
  };
  
  // Get server address (IP:port)
  const getServerAddress = (server) => {
    if (!server.allocation) return 'No address';
    return `${server.allocation.ip}:${server.allocation.port}`;
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
  
  // Server control functions
  const togglePower = async () => {
    try {
      const action = server.value.status === 'running' ? 'stop' : 'start';
      
      toast.add({
        title: `${action === 'start' ? 'Starting' : 'Stopping'} Server`,
        description: `Please wait while the server ${action === 'start' ? 'starts' : 'stops'}...`,
        color: 'info',
        icon: 'i-heroicons-information-circle'
      });
      
      await $fetch(`/api/pterodactyl/server/${serverId}/power`, {
        method: 'POST',
        body: { action }
      });
      
      // Update server status locally for immediate feedback
      server.value.status = action === 'start' ? 'running' : 'stopped';
      
      // Refresh server details after a delay to get updated status
      setTimeout(fetchServer, 3000);
      
      toast.add({
        title: `Server ${action === 'start' ? 'Started' : 'Stopped'}`,
        description: `The server has been ${action === 'start' ? 'started' : 'stopped'} successfully`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
      });
    } catch (error) {
      console.error(`Failed to ${server.value.status === 'running' ? 'stop' : 'start'} server:`, error);
      
      toast.add({
        title: 'Action Failed',
        description: `Failed to ${server.value.status === 'running' ? 'stop' : 'start'} the server`,
        color: 'error',
        icon: 'i-heroicons-exclamation-circle'
      });
    }
  };
  
  const restartServer = async () => {
    try {
      toast.add({
        title: 'Restarting Server',
        description: 'Please wait while the server restarts...',
        color: 'info',
        icon: 'i-heroicons-arrow-path'
      });
      
      await $fetch(`/api/pterodactyl/server/${serverId}/power`, {
        method: 'POST',
        body: { action: 'restart' }
      });
      
      // Refresh server details after a delay to get updated status
      setTimeout(fetchServer, 5000);
      
      toast.add({
        title: 'Server Restarted',
        description: 'The server has been restarted successfully',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      });
    } catch (error) {
      console.error('Failed to restart server:', error);
      
      toast.add({
        title: 'Restart Failed',
        description: 'Failed to restart the server',
        color: 'error',
        icon: 'i-heroicons-exclamation-circle'
      });
    }
  };
  
  const openFileManager = () => {
    window.open(`/pterodactyl/server/${serverId}/files`, '_blank');
  };
  
  const openBackupManager = () => {
    window.open(`/pterodactyl/server/${serverId}/backups`, '_blank');
  };
  
  // Initialize data
  onMounted(fetchServer);
  
  // Set up polling to refresh server status
  // let refreshInterval;
  // onMounted(() => {
  //   refreshInterval = setInterval(() => {
  //     fetchServer();
  //   }, 30000); // Refresh every 30 seconds
  // });
  
  onBeforeUnmount(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });
  </script>
  
  <style>
  @reference "~/assets/css/main.css";

  .control-btn {
    @apply p-3 rounded-lg flex items-center justify-center gap-2 
           transition-all duration-200 border border-transparent
           hover:border-gray-700/50 text-sm;
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
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
  </style>