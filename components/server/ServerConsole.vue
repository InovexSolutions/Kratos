<template>
  <div class="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-100 flex items-center gap-2">
        <Icon name="heroicons:command-line" class="text-purple-400" />
        Console
      </h2>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs"
              :class="isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
          <span class="w-2 h-2 rounded-full mr-1" 
                :class="{ 'bg-green-400': isConnected, 'bg-red-400': !isConnected }"></span>
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </span>
        <button
          class="text-blue-400 hover:text-blue-300 text-sm"
          @click="clearConsole">
          Clear
        </button>
      </div>
    </div>
    
    <div 
      ref="consoleContainer"
      class="bg-gray-900/50 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm text-gray-300"
      @wheel="handleScroll"
    >
      <div v-if="loading" class="flex justify-center items-center h-full">
        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      <div v-else-if="consoleLines.length === 0" class="text-center py-10 text-gray-500">
        No console output available
      </div>
      <div v-else>
        <div v-for="(line, index) in consoleLines" :key="index" 
             class="pb-1 border-b border-gray-800/30 last:border-0 whitespace-pre-wrap">
          {{ line }}
        </div>
      </div>
    </div>
    
    <div class="mt-4 flex">
      <input 
        v-model="commandInput" 
        type="text" 
        placeholder="Type command here..."
        class="flex-1 bg-gray-700/40 rounded-l-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
        @keyup.enter="sendCommand"
        :disabled="!isConnected || serverStatus !== 'running'"
      />
      <button 
        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="sendCommand"
        :disabled="!isConnected || serverStatus !== 'running'">
        Send
      </button>
    </div>

    <div v-if="connectionError" class="mt-2 text-red-400 text-sm">
      {{ connectionError }}
      <button @click="retryConnection" class="ml-2 text-blue-400 hover:underline">
        Retry
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  serverId: {
    type: String,
    required: true
  }
});

const commandInput = ref('');
const consoleLines = ref([]);
const loading = ref(true);
const isConnected = ref(false);
const connectionError = ref('');
const socket = ref(null);
const autoScroll = ref(true);
const serverStatus = ref('offline');
const consoleContainer = ref(null);
const refreshTokenTimeout = ref(null);
const reconnectAttempts = ref(0);
const MAX_RECONNECT_ATTEMPTS = 5;
const websocketDetails = ref(null);

// Function to connect to the WebSocket
const connectWebsocket = async () => {
  loading.value = true;
  connectionError.value = '';
  
  try {
    // If we don't have websocket details or need to refresh them
    if (!websocketDetails.value || reconnectAttempts.value % 3 === 0) {
      // Get websocket details from API
      websocketDetails.value = await $fetch(`/api/pterodactyl/server/${props.serverId}/websocket`);
      console.log('Fetched new websocket details');
    }
    
    // Close existing connection if any
    if (socket.value && socket.value.readyState !== WebSocket.CLOSED) {
      socket.value.close();
    }
    
    // Create new WebSocket connection
    console.log(`Connecting to WebSocket: ${websocketDetails.value.socket}`);
    socket.value = new WebSocket(websocketDetails.value.socket);
    
    socket.value.addEventListener('open', () => {
      console.log('WebSocket connected');
      reconnectAttempts.value = 0; // Reset reconnect attempts on success
      
      // Send authentication token
      socket.value.send(JSON.stringify({
        event: 'auth',
        args: [websocketDetails.value.token]
      }));
    });
    
    socket.value.addEventListener('message', handleWebSocketMessage);
    
    socket.value.addEventListener('close', (event) => {
      console.log(`WebSocket closed with code ${event.code}`, event.reason);
      isConnected.value = false;
      
      // Clear any pending token refresh
      if (refreshTokenTimeout.value) {
        clearTimeout(refreshTokenTimeout.value);
        refreshTokenTimeout.value = null;
      }
      
      // Only try to reconnect a certain number of times
      if (reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.value++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000);
        console.log(`Reconnecting in ${delay}ms, attempt ${reconnectAttempts.value}/${MAX_RECONNECT_ATTEMPTS}`);
        
        setTimeout(() => {
          if (!isConnected.value) {
            connectWebsocket();
          }
        }, delay);
      } else {
        connectionError.value = 'Failed to connect after multiple attempts. Please try again.';
        loading.value = false;
      }
    });
    
    socket.value.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      connectionError.value = 'Connection error. Please check if the server is online.';
      loading.value = false;
    });
    
  } catch (error) {
    console.error('Failed to get websocket details:', error);
    connectionError.value = 'Failed to connect to server console. Please try again.';
    isConnected.value = false;
    loading.value = false;
  }
};

// Handle WebSocket messages
const handleWebSocketMessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    
    if (data.event === 'auth success') {
      console.log('WebSocket authentication successful');
      isConnected.value = true;
      loading.value = false;
      
      // Request logs and stats
      socket.value.send(JSON.stringify({
        event: 'send logs',
        args: [null]
      }));
      
      socket.value.send(JSON.stringify({
        event: 'send stats',
        args: [null]
      }));
      
      // Set up token refresh before it expires (every 8 minutes)
      if (refreshTokenTimeout.value) {
        clearTimeout(refreshTokenTimeout.value);
      }
      refreshTokenTimeout.value = setTimeout(refreshWebsocketToken, 8 * 60 * 1000);
    }
    else if (data.event === 'console output') {
      if (data.args && data.args.length > 0) {
        consoleLines.value.push(data.args[0]);
        
        // Trim console if it gets too long
        if (consoleLines.value.length > 500) {
          consoleLines.value = consoleLines.value.slice(-500);
        }
        
        // Auto-scroll if enabled
        if (autoScroll.value) {
          scrollToBottom();
        }
      }
    }
    else if (data.event === 'status') {
      if (data.args && data.args.length > 0) {
        serverStatus.value = data.args[0];
      }
    }
    else if (data.event === 'token expiring') {
      console.log('WebSocket token expiring, refreshing...');
      refreshWebsocketToken();
    }
    else if (data.event === 'token expired') {
      console.log('WebSocket token expired, refreshing...');
      refreshWebsocketToken();
    }
    else if (data.event === 'stats') {
      if (data.args && data.args.length > 0) {
        try {
          const stats = JSON.parse(data.args[0]);
          serverStatus.value = stats.state;
        } catch (e) {
          console.error('Failed to parse stats:', e);
        }
      }
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
  }
};

// Refresh WebSocket token
const refreshWebsocketToken = async () => {
  console.log('Refreshing WebSocket token');
  try {
    // Get new token
    const newDetails = await $fetch(`/api/pterodactyl/server/${props.serverId}/websocket`);
    websocketDetails.value = newDetails;
    
    // Send new token to the socket
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({
        event: 'auth',
        args: [newDetails.token]
      }));
      
      console.log('New token sent to WebSocket');
      
      // Set up the next refresh
      if (refreshTokenTimeout.value) {
        clearTimeout(refreshTokenTimeout.value);
      }
      refreshTokenTimeout.value = setTimeout(refreshWebsocketToken, 8 * 60 * 1000);
    } else {
      console.warn('Socket not open, cannot send new token');
      // Attempt to reconnect
      connectWebsocket();
    }
  } catch (error) {
    console.error('Failed to refresh websocket token:', error);
    connectionError.value = 'Failed to refresh connection. Please try again.';
  }
};

// Manual reconnection
const retryConnection = () => {
  reconnectAttempts.value = 0;
  connectionError.value = '';
  connectWebsocket();
};

// Send command to the server
const sendCommand = () => {
  if (!commandInput.value.trim() || !isConnected.value || serverStatus.value !== 'running') return;
  
  // Add command to console for immediate feedback
  consoleLines.value.push(`> ${commandInput.value}`);
  
  // Send command via WebSocket
  socket.value.send(JSON.stringify({
    event: 'send command',
    args: [commandInput.value]
  }));
  
  // Clear input
  commandInput.value = '';
  
  // Ensure we scroll to bottom
  scrollToBottom();
};

// Clear console
const clearConsole = () => {
  consoleLines.value = [];
};

// Scroll to bottom of console
const scrollToBottom = () => {
  nextTick(() => {
    if (consoleContainer.value) {
      consoleContainer.value.scrollTop = consoleContainer.value.scrollHeight;
    }
  });
};

// Handle scroll event to detect manual scrolling
const handleScroll = () => {
  if (!consoleContainer.value) return;
  
  // Check if scrolled to bottom
  const isAtBottom = consoleContainer.value.scrollHeight - consoleContainer.value.scrollTop <= consoleContainer.value.clientHeight + 50;
  
  // Update autoScroll based on scroll position
  autoScroll.value = isAtBottom;
};

// Connect on mount
onMounted(() => {
  connectWebsocket();
});

// Disconnect on unmount
onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.close();
  }
  
  if (refreshTokenTimeout.value) {
    clearTimeout(refreshTokenTimeout.value);
  }
});
</script>